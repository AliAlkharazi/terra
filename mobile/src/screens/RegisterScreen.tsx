import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TapButton } from '@/components/TapButton';
import { colors, space, type } from '@/theme/tokens';
import { ui } from '@/theme/ui';
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
    <SafeAreaView style={ui.fillParchment}>
      <KeyboardAvoidingView style={ui.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Text style={ui.title}>Create your account</Text>
          <Text style={ui.subtitle}>Password needs at least 8 characters.</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={ui.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.textOnParchmentDim}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={ui.input}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textOnParchmentDim}
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label={status === 'loading' ? 'Creating…' : 'Create account'}
            variant="ember"
            onPress={handleRegister}
            disabled={status === 'loading'}
            style={styles.cta}
          />

          <TapButton style={ui.linkBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={ui.linkText}>Already have an account? Log in</Text>
          </TapButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: space.lg, justifyContent: 'center' },
  label: {
    fontFamily: type.bodyBold,
    fontSize: type.size.sm,
    color: colors.textOnParchmentDim,
    marginTop: space.md,
    marginBottom: space.xs,
  },
  error: { fontFamily: type.body, fontSize: type.size.sm, color: colors.coral500, marginTop: space.md },
  cta: { marginTop: space.xl },
});
