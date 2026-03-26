import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, spacing, shadows } from '../styles/theme';

const RegisterScreen = ({ navigation }) => {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Xerox Shop</Text>
          <Text style={styles.subtitle}>Create an account via email OTP</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.infoText}>
            To sign up, just go back to the login screen and enter your name and email.
            We'll send you a one-time code (OTP) to your email to log in.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Back to Login</Text>
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
  form: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.lg,
    ...shadows.default,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
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

