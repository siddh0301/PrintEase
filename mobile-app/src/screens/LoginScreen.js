import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, shadows } from '../styles/theme';

const LoginScreen = ({ navigation }) => {
  const route = useRoute();
  const emailFromParams = route.params?.email;
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timerCount, setTimerCount] = useState(0);
  const { requestOtp, verifyAndLogin } = useAuth();

  useEffect(() => {
    let interval = null;
    if (timerCount > 0) {
      interval = setInterval(() => {
        setTimerCount(prev => prev - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerCount]);

  useEffect(() => {
    if (emailFromParams) {
      setEmail(emailFromParams);
    }
  }, [emailFromParams]);

  const showMessage = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleRequestOtp = async () => {
    if (!email) {
      showMessage('Please enter your email');
      return;
    }

    setLoading(true);
    const result = await requestOtp(email, 'mobile_login');
    setLoading(false);

    if (!result.success) {
      console.log('requestOtp failed', result);
      showMessage(result.message);
    } else {
      setOtpSent(true);
      setTimerCount(120);
      showMessage('OTP sent to your email');
    }
  };

  const handleVerifyAndLogin = async () => {
    if (!email || !code) {
      showMessage('Enter email and OTP code');
      return;
    }
    setLoading(true);
    const result = await verifyAndLogin(email, code);
    setLoading(false);
    if (!result.success) {
      showMessage(result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Xerox Shop</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {otpSent && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>OTP Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={otpSent ? handleVerifyAndLogin : handleRequestOtp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? (otpSent ? 'Verifying...' : 'Sending...') : (otpSent ? 'Verify & Login' : 'Send OTP')}
            </Text>
          </TouchableOpacity>

          {otpSent && (
            <View style={styles.resendContainer}>
              {timerCount > 0 ? (
                <Text style={styles.resendText}>
                  Resend OTP in {Math.floor(timerCount / 60)}:{(timerCount % 60).toString().padStart(2, '0')}
                </Text>
              ) : (
                <TouchableOpacity onPress={handleRequestOtp} disabled={loading}>
                  <Text style={[styles.resendText, styles.resendLink]}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>New user? Just enter your name & email</Text>
          </TouchableOpacity>
        </View>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'OK',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  form: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.lg,
    ...shadows.default,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  resendContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default LoginScreen;
