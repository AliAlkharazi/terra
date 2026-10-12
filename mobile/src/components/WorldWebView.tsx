import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { AllocationState, BankState, District } from '@/types';
import type { TerraWorldObjectKind, TerraWorldObjectPress, TerraWorldViewDTO } from '@/types/worldView';
import type { LastEvent } from '@/store/budgetStore';

interface Props {
  districts: District[];
  allocationStates: AllocationState[];
  bankState: BankState;
  lastEvent: LastEvent | null;
  /** Legacy district-only callback; used when onObjectPress is omitted. */
  onDistrictPress?: (districtId: string) => void;
  /** Preferred WareTrack-style press handler (district | bank | goal | lock). */
  onObjectPress?: (press: TerraWorldObjectPress) => void;
  /** WareTrack-style full world DTO; null skips the terraSetWorldView push. */
  worldView?: TerraWorldViewDTO | null;
}

const OBJECT_KINDS: TerraWorldObjectKind[] = ['district', 'bank', 'goal', 'lock'];

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

function isObjectKind(value: unknown): value is TerraWorldObjectKind {
  return typeof value === 'string' && (OBJECT_KINDS as string[]).includes(value);
}

export function WorldWebView({
  districts,
  allocationStates,
  bankState,
  lastEvent,
  onDistrictPress,
  onObjectPress,
  worldView = null,
}: Props) {
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
    if (worldView == null) return;
    dispatch(`window.terraSetWorldView('${escape(worldView)}'); true;`);
  }, [worldView, dispatch]);

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

  const emitPress = useCallback(
    (press: TerraWorldObjectPress) => {
      if (onObjectPress) {
        onObjectPress(press);
        return;
      }
      if (press.kind === 'district' && onDistrictPress) {
        onDistrictPress(press.id);
      }
    },
    [onObjectPress, onDistrictPress]
  );

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data);

        if (payload.type === 'SCENE_READY') {
          isReadyRef.current = true;
          const queued = commandQueue.current;
          commandQueue.current = [];
          for (const js of queued) {
            webviewRef.current?.injectJavaScript(js);
          }
          return;
        }

        if (payload.type === 'objectPress' && isObjectKind(payload.kind) && typeof payload.id === 'string') {
          emitPress({ kind: payload.kind, id: payload.id });
          return;
        }

        // Legacy districtPress — support both `id` and historical `districtId`.
        if (payload.type === 'districtPress') {
          const id =
            typeof payload.id === 'string'
              ? payload.id
              : typeof payload.districtId === 'string'
              ? payload.districtId
              : null;
          if (id) emitPress({ kind: 'district', id });
          return;
        }

        if (payload.type === 'SCENE_ERROR') {
          console.error(
            `[Terra WebView error] ${payload.message}` +
              (payload.source ? ` (${payload.source}:${payload.line})` : '')
          );
        }
      } catch {
        // ignore malformed bridge messages
      }
    },
    [emitPress]
  );

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
