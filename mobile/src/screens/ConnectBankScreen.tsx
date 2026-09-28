import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { TapButton } from '@/components/TapButton';
import { colors, space, type } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';
import { useBudgetStore } from '@/store/budgetStore';
import {
  api,
  ApiError,
  API_BASE_URL,
  type BankConnectionSummary,
  type BankInstitution,
} from '@/api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'ConnectBank'>;

export function ConnectBankScreen({ navigation }: Props) {
  const token = useAuthStore((s) => s.token);
  const mode = useAuthStore((s) => s.mode);
  const mergeImportedBankTxs = useBudgetStore((s) => s.mergeImportedBankTxs);

  const [query, setQuery] = useState('Sparkasse');
  const [institutions, setInstitutions] = useState<BankInstitution[]>([]);
  const [connections, setConnections] = useState<BankConnectionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [mock, setMock] = useState(false);

  const loadConnections = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.listBankConnections(token);
      setConnections(res.connections);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not load connections');
    }
  }, [token]);

  const search = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.listBankInstitutions(token, { country: 'DE', q: query.trim() || undefined });
      setInstitutions(res.institutions);
      setMock(Boolean(res.mock));
    } catch (e) {
      setStatus(e instanceof ApiError ? e.message : 'Could not list banks');
    } finally {
      setLoading(false);
    }
  }, [token, query]);

  useEffect(() => {
    if (mode !== 'synced' || !token) return;
    void loadConnections();
    void search();
  }, [mode, token, loadConnections, search]);

  if (mode !== 'synced' || !token) {
    return (
      <View style={styles.fill}>
        <SafeAreaView style={styles.fill}>
          <TopBar title="Connect bank" onBack={() => navigation.goBack()} />
          <View style={styles.pad}>
            <Text style={styles.lead}>
              Log in to Terra first — bank linking uses your account so the Sparkasse session stays on the
              server (never your PIN).
            </Text>
            <TapButton style={styles.primary} onPress={() => useAuthStore.getState().logout()}>
              <Text style={styles.primaryText}>Go to login</Text>
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
          <WebView
            source={{ uri: authUrl }}
            onNavigationStateChange={(nav) => {
              const url = nav.url ?? '';
              if (url.includes('/bank/callback') && (url.includes('terra-bank') || url.includes('code='))) {
                // Wait for callback page; detect success via data attribute load
              }
              if (url.includes('data-terra-bank') || url.includes('Bank connected') || url.includes('/bank/callback')) {
                // Poll: when callback finishes it shows success HTML
              }
            }}
            onLoadEnd={(e) => {
              const url = e.nativeEvent.url ?? '';
              if (url.includes('/bank/callback')) {
                // Give the server a moment, then close WebView and refresh
                setTimeout(async () => {
                  setAuthUrl(null);
                  await loadConnections();
                  setStatus('Connected — tap Sync to pull transactions.');
                }, 800);
              }
            }}
            style={styles.webview}
          />
        </SafeAreaView>
      </View>
    );
  }

  const connect = async (inst: BankInstitution) => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.startBankConnect(token, {
        institutionId: inst.id,
        institutionName: inst.name,
        country: inst.country,
      });
      setAuthUrl(res.url);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Connect failed');
    } finally {
      setLoading(false);
    }
  };

  const sync = async (connectionId?: string) => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.syncBank(token, connectionId);
      const { added, skipped } = mergeImportedBankTxs(res.imported);
      await loadConnections();
      setStatus(`Synced: ${added} new, ${skipped} already in Terra (${res.skipped} skipped on server).`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = (connectionId: string) => {
    Alert.alert('Disconnect bank?', 'Removes the Open Banking session. Imported transactions stay in Terra.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.disconnectBank(token, connectionId);
            await loadConnections();
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
        <TopBar title="Connect bank" onBack={() => navigation.goBack()} />
        <View style={styles.pad}>
          <Text style={styles.lead}>
            Link your Sparkasse via Open Banking (Enable Banking). PIN stays with the bank.
            {mock ? ' Demo mode is on — no real bank login.' : ''}
          </Text>
          <Text style={styles.meta}>API: {API_BASE_URL}</Text>

          {connections.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Connected</Text>
              {connections.map((c) => (
                <View key={c.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{c.institutionName}</Text>
                  <Text style={styles.meta}>
                    Last sync:{' '}
                    {c.lastSyncedAt ? new Date(c.lastSyncedAt).toLocaleString() : 'never'}
                  </Text>
                  <View style={styles.rowBtns}>
                    <TapButton style={styles.primary} onPress={() => sync(c.id)}>
                      <Text style={styles.primaryText}>Sync</Text>
                    </TapButton>
                    <TapButton style={styles.secondary} onPress={() => disconnect(c.id)}>
                      <Text style={styles.secondaryText}>Disconnect</Text>
                    </TapButton>
                  </View>
                </View>
              ))}
              <TapButton style={styles.link} onPress={() => navigation.navigate('BankInbox')}>
                <Text style={styles.linkText}>Uncategorized inbox →</Text>
              </TapButton>
            </View>
          )}

          <Text style={styles.sectionTitle}>Find Sparkasse</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void search()}
            placeholder="Search banks"
            placeholderTextColor={colors.textOnParchmentDim}
            style={styles.input}
            autoCorrect={false}
          />
          <TapButton style={styles.secondary} onPress={() => void search()}>
            <Text style={styles.secondaryText}>Search</Text>
          </TapButton>
        </View>

        {loading && <ActivityIndicator color={colors.moss800} style={{ marginVertical: 12 }} />}
        {status ? <Text style={styles.status}>{status}</Text> : null}

        <FlatList
          data={institutions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !loading ? <Text style={styles.empty}>No banks matched. Try “Sparkasse”.</Text> : null
          }
          renderItem={({ item }) => (
            <TapButton style={styles.instRow} onPress={() => void connect(item)}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.meta}>{item.bic ?? item.country}</Text>
            </TapButton>
          )}
        />
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
    marginBottom: space.sm,
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
  pad: { paddingHorizontal: space.md },
  lead: { fontFamily: type.body, fontSize: 14, color: colors.textOnParchmentDim, marginBottom: 8, lineHeight: 20 },
  meta: { fontFamily: type.body, fontSize: 12, color: colors.textOnParchmentDim, marginBottom: 4 },
  section: { marginBottom: space.md },
  sectionTitle: { fontFamily: type.bodyBold, fontSize: 14, color: colors.moss900, marginTop: 12, marginBottom: 8 },
  input: {
    backgroundColor: '#EDE8DC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: type.body,
    color: colors.moss900,
    marginBottom: 8,
  },
  primary: {
    backgroundColor: colors.ember500,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flex: 1,
  },
  primaryText: { fontFamily: type.bodyBold, color: colors.moss900 },
  secondary: {
    backgroundColor: colors.moss800,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
    flex: 1,
  },
  secondaryText: { fontFamily: type.bodyBold, color: colors.parchment },
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 10 },
  card: {
    backgroundColor: '#EDE8DC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  cardTitle: { fontFamily: type.bodyBold, fontSize: 15, color: colors.moss900 },
  link: { paddingVertical: 8 },
  linkText: { fontFamily: type.body, color: colors.moss700 },
  list: { paddingHorizontal: space.md, paddingBottom: 40 },
  instRow: {
    backgroundColor: '#EDE8DC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  empty: { textAlign: 'center', color: colors.textOnParchmentDim, marginTop: 24, fontFamily: type.body },
  status: {
    marginHorizontal: space.md,
    marginBottom: 8,
    fontFamily: type.body,
    color: colors.moss800,
  },
  webview: { flex: 1 },
});
