import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { TapButton } from '@/components/TapButton';
import { colors, radius, space, type } from '@/theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const register = useAuthStore((s) => s.register);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    clearError();
    await register(email.trim(), password);
  };

  return (
    <SafeAreaView style={styles.fill}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Password needs at least 8 characters.</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.textOnParchmentDim}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textOnParchmentDim}
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TapButton style={styles.primaryButton} onPress={handleRegister} disabled={status === 'loading'}>
            <Text style={styles.primaryButtonText}>{status === 'loading' ? 'Creating…' : 'Create account'}</Text>
          </TapButton>

          <TapButton style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Already have an account? Log in</Text>
          </TapButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.parchment },
  content: { flex: 1, padding: space.lg, justifyContent: 'center' },
  title: { fontFamily: type.display, fontSize: type.size.xxl, color: colors.textOnParchment },
  subtitle: { fontFamily: type.body, fontSize: type.size.sm, color: colors.textOnParchmentDim, marginTop: space.xs, marginBottom: space.lg },
  label: { fontFamily: type.bodyBold, fontSize: type.size.sm, color: colors.textOnParchmentDim, marginTop: space.md, marginBottom: space.xs },
  input: {
    fontFamily: type.body, fontSize: type.size.base, color: colors.textOnParchment,
    borderBottomWidth: 1, borderBottomColor: colors.parchmentDim, paddingVertical: space.sm,
  },
  error: { fontFamily: type.body, fontSize: type.size.sm, color: colors.coral500, marginTop: space.md },
  primaryButton: { marginTop: space.xl, backgroundColor: colors.ember500, borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center' },
  primaryButtonText: { fontFamily: type.bodyBold, fontSize: type.size.base, color: colors.moss900 },
  linkButton: { marginTop: space.md, alignItems: 'center' },
  linkText: { fontFamily: type.body, fontSize: type.size.sm, color: colors.textOnParchmentDim },
});
