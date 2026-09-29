import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { TapButton } from '@/components/TapButton';
import { colors, space, type } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';
import { useBudgetStore } from '@/store/budgetStore';
import { api, API_BASE_URL, type BankConnectionSummary } from '@/api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'ConnectBank'>;

export function ConnectBankScreen({ navigation }: Props) {
  const token = useAuthStore((s) => s.token);
  const mode = useAuthStore((s) => s.mode);
  const mergeImportedBankTxs = useBudgetStore((s) => s.mergeImportedBankTxs);

  const [connection, setConnection] = useState<BankConnectionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);

  const refreshInbox = useCallback(() => {
    setUncategorizedCount(useBudgetStore.getState().getUncategorizedTransactions().length);
  }, []);

  const loadConnections = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.listBankConnections(token);
      const saar =
        res.connections.find((c) => /saarbrück|saarbrueck|saarbruck/i.test(c.institutionName)) ??
        res.connections[0] ??
        null;
      setConnection(saar);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not load connection');
    }
  }, [token]);

  useEffect(() => {
    if (mode === 'synced' && token) {
      void loadConnections();
      refreshInbox();
    }
  }, [mode, token, loadConnections, refreshInbox]);

  if (mode !== 'synced' || !token) {
    return (
      <View style={styles.fill}>
        <SafeAreaView style={styles.fill}>
          <TopBar title="Sparkasse" onBack={() => navigation.goBack()} />
          <View style={styles.center}>
            <Text style={styles.brand}>Sparkasse Saarbrücken</Text>
            <Text style={styles.lead}>Log in to Terra once, then one tap connects your Girokonto.</Text>
            <TapButton style={styles.primary} onPress={() => useAuthStore.getState().logout()}>
              <Text style={styles.primaryText}>Log in</Text>
            </TapButton>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (authUrl) {
    return (
      <View style={styles.fill}>
        <SafeAreaView style={styles.fill}>
          <TopBar title="Authorize" onBack={() => setAuthUrl(null)} />
          <Text style={styles.authHint}>Sign in with your Sparkasse Anmeldename + PIN, then confirm with pushTAN.</Text>
          <WebView
            source={{ uri: authUrl }}
            onLoadEnd={(e) => {
              const url = e.nativeEvent.url ?? '';
              if (url.includes('/bank/callback')) {
                setTimeout(async () => {
                  setAuthUrl(null);
                  await loadConnections();
                  setStatus('Connected. Syncing…');
                  try {
                    const res = await api.syncBank(token);
                    const { added } = mergeImportedBankTxs(res.imported);
                    refreshInbox();
                    setStatus(added ? `Imported ${added} transactions.` : 'Up to date.');
                  } catch (err) {
                    setStatus(err instanceof Error ? err.message : 'Sync failed');
                  }
                }, 600);
              }
            }}
            style={styles.webview}
          />
        </SafeAreaView>
      </View>
    );
  }

  const connect = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.connectSparkasseSaarbrucken(token);
      setAuthUrl(res.url);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Connect failed');
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    if (!connection) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.syncBank(token, connection.id);
      const { added, skipped } = mergeImportedBankTxs(res.imported);
      await loadConnections();
      refreshInbox();
      setStatus(`Synced: ${added} new${skipped ? `, ${skipped} already imported` : ''}.`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    if (!connection) return;
    Alert.alert('Disconnect Sparkasse?', 'Imported transactions stay in Terra.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.disconnectBank(token, connection.id);
            setConnection(null);
            setStatus('Disconnected.');
          } catch (e) {
            setStatus(e instanceof Error ? e.message : 'Disconnect failed');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <TopBar title="Sparkasse" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.brand}>Sparkasse Saarbrücken</Text>
          <Text style={styles.lead}>
            {connection
              ? 'Your Girokonto is linked. Sync pulls new bookings into Terra.'
              : 'One tap opens Sparkasse Online-Banking. Your PIN never touches Terra.'}
          </Text>

          {loading && <ActivityIndicator color={colors.moss800} style={{ marginVertical: 16 }} />}

          {!connection ? (
            <TapButton style={styles.primaryHuge} onPress={() => void connect()} disabled={loading}>
              <Text style={styles.primaryHugeText}>Connect Sparkasse Saarbrücken</Text>
            </TapButton>
          ) : (
            <>
              <Text style={styles.meta}>
                Linked · last sync{' '}
                {connection.lastSyncedAt
                  ? new Date(connection.lastSyncedAt).toLocaleString()
                  : 'never'}
              </Text>
              <TapButton style={styles.primaryHuge} onPress={() => void sync()} disabled={loading}>
                <Text style={styles.primaryHugeText}>Sync transactions</Text>
              </TapButton>
              {uncategorizedCount > 0 && (
                <TapButton style={styles.secondary} onPress={() => navigation.navigate('BankInbox')}>
                  <Text style={styles.secondaryText}>
                    Inbox · {uncategorizedCount} to categorize
                  </Text>
                </TapButton>
              )}
              <TapButton style={styles.link} onPress={disconnect}>
                <Text style={styles.linkText}>Disconnect</Text>
              </TapButton>
            </>
          )}

          {status ? <Text style={styles.status}>{status}</Text> : null}
          <Text style={styles.apiHint}>{API_BASE_URL}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.topBar}>
      <TapButton onPress={onBack} style={styles.back} pressedScale={0.9}>
        <Text style={styles.backText}>←</Text>
      </TapButton>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#F4F1EA' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingTop: space.xs,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.parchmentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 18, color: colors.moss800 },
  title: { fontFamily: type.bodyBold, fontSize: 16, color: colors.moss900 },
  center: {
    flex: 1,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    paddingBottom: 48,
  },
  brand: {
    fontFamily: type.display,
    fontSize: 28,
    color: colors.moss900,
    marginBottom: 12,
  },
  lead: {
    fontFamily: type.body,
    fontSize: 15,
    color: colors.textOnParchmentDim,
    lineHeight: 22,
    marginBottom: 28,
  },
  primary: {
    backgroundColor: colors.ember500,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { fontFamily: type.bodyBold, color: colors.moss900, fontSize: 16 },
  primaryHuge: {
    backgroundColor: '#E30613',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  primaryHugeText: {
    fontFamily: type.bodyBold,
    color: '#FFFFFF',
    fontSize: 17,
    textAlign: 'center',
  },
  secondary: {
    marginTop: 12,
    backgroundColor: colors.moss800,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: { fontFamily: type.bodyBold, color: colors.parchment },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { fontFamily: type.body, color: colors.textOnParchmentDim },
  meta: {
    fontFamily: type.body,
    fontSize: 13,
    color: colors.textOnParchmentDim,
    marginBottom: 16,
  },
  status: {
    marginTop: 20,
    fontFamily: type.body,
    color: colors.moss800,
    lineHeight: 20,
  },
  apiHint: {
    marginTop: 24,
    fontFamily: type.body,
    fontSize: 11,
    color: colors.textOnParchmentDim,
    opacity: 0.7,
  },
  authHint: {
    paddingHorizontal: space.md,
    paddingBottom: 8,
    fontFamily: type.body,
    fontSize: 13,
    color: colors.textOnParchmentDim,
  },
  webview: { flex: 1 },
});
