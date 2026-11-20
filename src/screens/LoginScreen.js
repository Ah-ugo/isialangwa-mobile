import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Lock, Eye, EyeSlash } from 'iconsax-react-native';
import { useAuth } from '../context/AuthContext';
import { T, APP_NAME, SUB_TITLE } from '../theme/colors';

export default function LoginScreen() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setError('Please enter your username or email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Check your credentials and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>APC</Text>
            </View>
            <Text style={styles.title}>{APP_NAME}</Text>
            <Text style={styles.subtitle}>{SUB_TITLE}</Text>
            <Text style={styles.agentTag}>Field Agent Portal</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Username or Email</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color={T.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Enter username or email"
                placeholderTextColor={T.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={T.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={T.muted}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.showBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlash size={18} color={T.muted} />
                ) : (
                  <Eye size={18} color={T.muted} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In to Directory</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            For agent onboarding or password assistance, contact your ward coordinator.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandBadge: {
    backgroundColor: T.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  brandBadgeText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: T.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: T.muted,
    fontWeight: '500',
  },
  agentTag: {
    fontSize: 12,
    color: T.primary,
    fontWeight: '700',
    marginTop: 6,
    backgroundColor: T.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: T.danger,
  },
  errorText: { color: T.danger, fontSize: 13, fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '600', color: T.text, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    backgroundColor: T.bg,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: T.text,
  },
  showBtn: {
    padding: 4,
  },
  loginBtn: {
    backgroundColor: T.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  footer: { textAlign: 'center', color: T.muted, fontSize: 12, lineHeight: 18, paddingHorizontal: 20 },
});
