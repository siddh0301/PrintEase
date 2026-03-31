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
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, shadows } from '../styles/theme';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [countdown, setCountdown] = useState(0);
  const { register } = useAuth();

  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0 && messageType === 'success' && message) {
      setMessage('');
      navigation.navigate('Login', { email: email.trim() });
    }
  }, [countdown, messageType, message, navigation, email]);

  const showMessage = (message, type = 'error') => {
    setMessage(message);
    setMessageType(type);
    if (type === 'error') {
      setTimeout(() => setMessage(''), 5000); // Clear error messages after 5 seconds
    }
  };

  const handleRegister = async () => {
    // Validation
    if (!name.trim()) {
      showMessage('Please enter your full name');
      return;
    }

    if (!email.trim()) {
      showMessage('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Please enter a valid email address');
      return;
    }

    if (email.length > 254) {
      showMessage('Email address is too long');
      return;
    }

    if (!mobile.trim()) {
      showMessage('Please enter your mobile number');
      return;
    }

    if (mobile.length != 10) {
      showMessage('Mobile number must be 10 digits');
      return;
    }

    const phoneRegex = /^\d+$/;
    if (!phoneRegex.test(mobile)) {
      showMessage('Mobile number must contain only digits');
      return;
    }

    setLoading(true);
    const result = await register({ name: name.trim(), email: email.trim(), phone: mobile.trim() });
    setLoading(false);

    if (!result.success) {
      showMessage(result.message);
    } else {
      setCountdown(3);
      setMessage('User registered successfully, you will be redirected to the login screen');
      setMessageType('success');
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
          <Text style={styles.subtitle}>Create your account</Text>
          {message ? (
            <Text style={[styles.message, messageType === 'success' ? styles.successMessage : styles.errorMessage]}>
              {message}{countdown > 0 && messageType === 'success' ? ` in ${countdown} second${countdown !== 1 ? 's' : ''}` : ''}
            </Text>
          ) : null}
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your mobile number"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Registering...' : 'Register'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  message: {
    marginTop: spacing.sm,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  successMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
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
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  linkButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default RegisterScreen;