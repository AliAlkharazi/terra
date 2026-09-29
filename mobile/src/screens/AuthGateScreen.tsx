import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TapButton } from '@/components/TapButton';
import { colors, gradients, space, type } from '@/theme/tokens';
import { ui } from '@/theme/ui';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthGate'>;

export function AuthGateScreen({ navigation }: Props) {
  const continueOffline = useAuthStore((s) => s.continueOffline);

  return (
    <LinearGradient colors={[...gradients.auth]} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>WELCOME TO</Text>
          <Text style={styles.title}>Terra</Text>
          <Text style={styles.subtitle}>
            A budget tracker that's actually a living 3D city. Spend and it damages a district — save
            and the bank grows a floor.
          </Text>

          <PrimaryButton label="Log in" variant="ember" onPress={() => navigation.navigate('Login')} />

          <PrimaryButton
            label="Create an account"
            variant="ghostMoss"
            onPress={() => navigation.navigate('Register')}
            style={styles.secondarySpacing}
          />

          <TapButton style={ui.linkBtn} onPress={continueOffline}>
            <Text style={ui.linkTextOnMoss}>Continue without an account →</Text>
          </TapButton>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flex: 1, padding: space.lg, justifyContent: 'center' },
  eyebrow: { fontFamily: type.bodyBold, fontSize: type.size.xs, color: colors.sage300, letterSpacing: 1.5 },
  title: { fontFamily: type.display, fontSize: type.size.display, color: colors.parchment, marginTop: space.xs },
  subtitle: {
    fontFamily: type.body,
    fontSize: type.size.base,
    color: colors.textOnMossDim,
    marginTop: space.md,
    marginBottom: space.xl,
    lineHeight: 22,
  },
  secondarySpacing: { marginTop: space.sm },
});
