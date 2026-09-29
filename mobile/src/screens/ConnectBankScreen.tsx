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
import { ModalTopBar as TopBar } from '@/components/ui/ModalTopBar';
import { colors, radius, space, type } from '@/theme/tokens';
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

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.creamLift },
  pad: { paddingHorizontal: space.md },
  lead: {
    fontFamily: type.body,
    fontSize: type.size.sm,
    color: colors.textOnParchmentDim,
    marginBottom: space.sm,
    lineHeight: 20,
  },
  meta: {
    fontFamily: type.body,
    fontSize: type.size.xs,
    color: colors.textOnParchmentDim,
    marginBottom: space.xs,
  },
  section: { marginBottom: space.md },
  sectionTitle: {
    fontFamily: type.bodyBold,
    fontSize: type.size.sm,
    color: colors.moss900,
    marginTop: space.group,
    marginBottom: space.sm,
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    paddingHorizontal: space.group,
    paddingVertical: space.group,
    fontFamily: type.body,
    color: colors.moss900,
    marginBottom: space.sm,
  },
  primary: {
    backgroundColor: colors.ember500,
    borderRadius: radius.md,
    paddingVertical: space.group,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    flex: 1,
  },
  primaryText: { fontFamily: type.bodyBold, color: colors.moss900 },
  secondary: {
    backgroundColor: colors.moss800,
    borderRadius: radius.md,
    paddingVertical: space.group,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginBottom: space.sm,
    flex: 1,
  },
  secondaryText: { fontFamily: type.bodyBold, color: colors.parchment },
  rowBtns: { flexDirection: 'row', gap: space.sm, marginTop: space.tight },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: space.group,
    marginBottom: space.sm,
  },
  cardTitle: { fontFamily: type.bodyBold, fontSize: type.size.sm + 1, color: colors.moss900 },
  link: { paddingVertical: space.sm },
  linkText: { fontFamily: type.body, color: colors.moss700 },
  list: { paddingHorizontal: space.md, paddingBottom: 40 },
  instRow: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: space.group,
    marginBottom: space.sm,
  },
  empty: {
    textAlign: 'center',
    color: colors.textOnParchmentDim,
    marginTop: space.lg,
    fontFamily: type.body,
  },
  status: {
    marginHorizontal: space.md,
    marginBottom: space.sm,
    fontFamily: type.body,
    color: colors.moss800,
  },
  webview: { flex: 1 },
});
