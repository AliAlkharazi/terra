import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { TapButton } from '@/components/TapButton';
import { colors, radius, space, type } from '@/theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthGate'>;

export function AuthGateScreen({ navigation }: Props) {
  const continueOffline = useAuthStore((s) => s.continueOffline);

  return (
    <LinearGradient colors={[colors.moss700, colors.moss900]} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>WELCOME TO</Text>
          <Text style={styles.title}>Terra</Text>
          <Text style={styles.subtitle}>
            A budget tracker that's actually a living 3D city. Spend and it damages a district — save
            and the bank grows a floor.
          </Text>

          <TapButton style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.primaryButtonText}>Log in</Text>
          </TapButton>

          <TapButton style={styles.secondaryButton} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.secondaryButtonText}>Create an account</Text>
          </TapButton>

          <TapButton style={styles.linkButton} onPress={continueOffline}>
            <Text style={styles.linkText}>Continue without an account →</Text>
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
  subtitle: { fontFamily: type.body, fontSize: type.size.base, color: colors.textOnMossDim, marginTop: space.md, marginBottom: space.xl, lineHeight: 22 },
  primaryButton: { backgroundColor: colors.ember500, borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center' },
  primaryButtonText: { fontFamily: type.bodyBold, fontSize: type.size.base, color: colors.moss900 },
  secondaryButton: { marginTop: space.sm, backgroundColor: colors.moss700, borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center' },
  secondaryButtonText: { fontFamily: type.bodyBold, fontSize: type.size.base, color: colors.parchment },
  linkButton: { marginTop: space.lg, alignItems: 'center' },
  linkText: { fontFamily: type.body, fontSize: type.size.sm, color: colors.textOnMossDim },
});
