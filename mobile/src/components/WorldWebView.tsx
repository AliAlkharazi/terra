import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { BankState, District, DistrictState } from '@/types';
import type { LastEvent } from '@/store/budgetStore';

interface Props {
  districts: District[];
  districtStates: DistrictState[];
  bankState: BankState;
  lastEvent: LastEvent | null;
  onDistrictPress: (districtId: string) => void;
}

/**
 * Interim bridge into the Three.js WebView picture.
 * Not the long-term World: CoC-quality rendering lives in /unity.
 * See docs/UNITY_WORLD.md.
 *
 * Bridges React Native state into the Three.js WebView city scene.
 *
 * Readiness handling: the scene posts { type: 'SCENE_READY' } once its
 * setup (including all window.terraX bridge functions) is complete. Any
 * injectJavaScript calls made before that message arrives are queued
 * in commandQueue rather than dropped — a plain "if not ready, return"
 * gate (the previous approach) silently loses events that fire during
 * app boot, since a dependency-gated useEffect won't re-run just because
 * isReady flipped true with no other prop change. Queueing and flushing
 * on ready fixes that class of bug outright.
 */
export function WorldWebView({ districts, districtStates, bankState, lastEvent, onDistrictPress }: Props) {
  const webviewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const commandQueue = useRef<string[]>([]);
  const lastSeenNonce = useRef(0);

  const escape = (obj: unknown) => JSON.stringify(obj).replace(/'/g, "\\'");

  /** Central dispatch: injects immediately if ready, otherwise queues for flush-on-ready. */
  const dispatch = useCallback(
    (js: string) => {
      if (isReady) {
        webviewRef.current?.injectJavaScript(js);
      } else {
        commandQueue.current.push(js);
      }
    },
    [isReady]
  );

  useEffect(() => {
    dispatch(`window.terraSetDistricts('${escape(districts)}'); true;`);
    // districts are effectively static after mount (only budgets change,
    // which doesn't affect the id/label/icon set) — intentionally only
    // depends on the array reference, not a deep field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districts]);

  useEffect(() => {
    dispatch(`window.terraSetHealth('${escape(districtStates)}'); true;`);
  }, [districtStates, dispatch]);

  useEffect(() => {
    dispatch(`window.terraSetBank('${escape(bankState)}'); true;`);
  }, [bankState, dispatch]);

  useEffect(() => {
    if (!lastEvent || lastEvent.nonce === lastSeenNonce.current) return;
    lastSeenNonce.current = lastEvent.nonce;

    if (lastEvent.kind === 'spend' && lastEvent.districtId) {
      dispatch(`window.terraTriggerSpend('${lastEvent.districtId}'); true;`);
    } else if (lastEvent.kind === 'save') {
      dispatch(`window.terraTriggerSave(); true;`);
    }
  }, [lastEvent, dispatch]);

  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === 'SCENE_READY') {
        // Flush everything queued while the scene was still loading, in order.
        const queued = commandQueue.current;
        commandQueue.current = [];
        for (const js of queued) {
          webviewRef.current?.injectJavaScript(js);
        }
        setIsReady(true);
      } else if (payload.type === 'districtPress') {
        onDistrictPress(payload.districtId);
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
