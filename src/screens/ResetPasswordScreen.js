import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { token, email } = route.params || {};
  const { isDarkMode } = useContext(ThemeContext);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    if (!token || !email) {
      Alert.alert('Error', 'Invalid password reset link');
      setValidating(false);
      return;
    }

    try {
      const storedData = await AsyncStorage.getItem(`reset_token_${email}`);
      if (storedData) {
        const { token: storedToken, expires } = JSON.parse(storedData);

        if (storedToken === token && Date.now() < expires) {
          setIsValidToken(true);
        } else {
          Alert.alert('Error', 'Password reset link has expired or is invalid');
        }
      } else {
        Alert.alert('Error', 'Invalid password reset link');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      Alert.alert('Error', 'Failed to validate reset link');
    } finally {
      setValidating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // In a real app, this would call an API.
      // For this demo, we'll update the stored user data in AsyncStorage if it exists.
      const storedUsers = await AsyncStorage.getItem('users');
      let users = storedUsers ? JSON.parse(storedUsers) : [];

      const userIndex = users.findIndex((u) => u.email === email);

      if (userIndex !== -1) {
        users[userIndex].password = password;
        await AsyncStorage.setItem('users', JSON.stringify(users));

        // Clear the reset token
        await AsyncStorage.removeItem(`reset_token_${email}`);

        navigation.navigate('Login', {
          message:
            'Your password has been reset successfully. Please login with your new password.',
        });
      } else {
        // Fallback for demo if user not found in local storage (e.g. if using mock auth)
        // Still clear token
        await AsyncStorage.removeItem(`reset_token_${email}`);

        navigation.navigate('Login', {
          message:
            'Your password has been reset successfully. Please login with your new password.',
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert('Error', 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <View style={[styles.container, styles.centerContent, isDarkMode && styles.containerDark]}>
        <ActivityIndicator size="large" color="#667EEA" />
        <Text style={[styles.validatingText, isDarkMode && styles.textDark]}>
          Validating link...
        </Text>
      </View>
    );
  }

  if (!isValidToken) {
    return (
      <View style={[styles.container, styles.centerContent, isDarkMode && styles.containerDark]}>
        <Icon name="error-outline" size={60} color="#EF4444" />
        <Text style={[styles.errorText, isDarkMode && styles.textDark]}>
          Invalid or Expired Link
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.gradientButton}>
            <Text style={styles.buttonText}>Back to Login</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, isDarkMode && styles.containerDark]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.iconContainer}>
            <Icon name="lock" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>Reset Password</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
            Create a new password for your account
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              placeholder="New Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              placeholder="Confirm New Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Icon
                name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
            <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.gradientButton}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 5,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  titleDark: {
    color: '#F9FAFB',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  subtitleDark: {
    color: '#9CA3AF',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputDark: {
    color: '#fff',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  button: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  validatingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B5563',
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 18,
    color: '#EF4444',
    fontWeight: '600',
  },
  textDark: {
    color: '#F9FAFB',
  },
});

export default ResetPasswordScreen;
