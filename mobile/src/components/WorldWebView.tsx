import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { AllocationState, BankState, District } from '@/types';
import type { LastEvent } from '@/store/budgetStore';

interface Props {
  districts: District[];
  allocationStates: AllocationState[];
  bankState: BankState;
  lastEvent: LastEvent | null;
  onDistrictPress: (districtId: string) => void;
}

function toBridgeHealthPayload(states: AllocationState[]) {
  return states.map((s) => {
    const healthPct =
      s.allocated > 0
        ? Math.max(0, Math.min(100, Math.round((s.available / s.allocated) * 100)))
        : s.spent > 0
        ? 0
        : 100;
    return { districtId: s.districtId, healthPct, budget: s.allocated };
  });
}

export function WorldWebView({ districts, allocationStates, bankState, lastEvent, onDistrictPress }: Props) {
  const webviewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);
  const commandQueue = useRef<string[]>([]);
  const lastSeenNonce = useRef(0);

  const escape = (obj: unknown) => JSON.stringify(obj).replace(/'/g, "\\'");

  const dispatch = useCallback((js: string) => {
    if (isReadyRef.current) {
      webviewRef.current?.injectJavaScript(js);
    } else {
      commandQueue.current.push(js);
    }
  }, []);

  useEffect(() => {
    dispatch(`window.terraSetDistricts('${escape(districts)}'); true;`);
  }, [districts, dispatch]);

  useEffect(() => {
    dispatch(`window.terraSetHealth('${escape(toBridgeHealthPayload(allocationStates))}'); true;`);
  }, [allocationStates, dispatch]);

  useEffect(() => {
    dispatch(`window.terraSetBank('${escape(bankState)}'); true;`);
  }, [bankState, dispatch]);

  useEffect(() => {
    if (!lastEvent || lastEvent.nonce === lastSeenNonce.current) return;
    lastSeenNonce.current = lastEvent.nonce;

    if (lastEvent.kind === 'spend' && lastEvent.districtId) {
      const amountArg = lastEvent.amount != null ? `, ${lastEvent.amount}` : '';
      dispatch(`window.terraTriggerSpend('${lastEvent.districtId}'${amountArg}); true;`);
    } else if (lastEvent.kind === 'income') {
      const amountArg = lastEvent.amount != null ? `${lastEvent.amount}` : '';
      dispatch(`window.terraTriggerSave(${amountArg}); true;`);
    }
  }, [lastEvent, dispatch]);

  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);

      if (payload.type === 'SCENE_READY') {
        isReadyRef.current = true;
        const queued = commandQueue.current;
        commandQueue.current = [];
        for (const js of queued) {
          webviewRef.current?.injectJavaScript(js);
        }
      } else if (payload.type === 'districtPress') {
        onDistrictPress(payload.districtId);
      } else if (payload.type === 'SCENE_ERROR') {
        console.error(
          `[Terra WebView error] ${payload.message}` +
            (payload.source ? ` (${payload.source}:${payload.line})` : '')
        );
      }
    } catch {
      // ignore malformed bridge messages
    }
  }, [onDistrictPress]);

  return (
    <WebView
      ref={webviewRef}
      style={styles.fill}
      source={require('../../assets/webview/scene.html')}
      onMessage={handleMessage}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      overScrollMode="never"
      bounces={false}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: 'transparent' },
});
