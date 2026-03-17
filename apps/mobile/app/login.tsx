import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/hooks/useAuth';
import { router } from 'expo-router';
import { theme } from '../src/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError('Completá todos los campos');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>COSPEC LTD</Text>
            <Text style={styles.title}>Acceso tecnico en campo</Text>
            <Text style={styles.subtitle}>
              Una base visual mas seria para trabajar reclamos, resolver offline y sincronizar sin caos.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ingresar</Text>
            <Text style={styles.cardText}>Usa tu cuenta operativa para ver asignaciones y registrar resoluciones.</Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholderTextColor={theme.colors.textSoft}
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                placeholderTextColor={theme.colors.textSoft}
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={theme.colors.textStrong} /> : <Text style={styles.buttonText}>Ingresar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 18,
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  card: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.lg,
    padding: 32,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: theme.colors.textMuted,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cardText: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.textMuted,
  },
  form: {
    gap: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: 'rgba(8, 17, 29, 0.45)',
  },
  error: {
    color: '#fecaca',
    fontSize: 13,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.58,
  },
  buttonText: {
    color: theme.colors.textStrong,
    fontWeight: '700',
    fontSize: 16,
  },
});
