import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.logoWrapper}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>✚</Text>
            </View>

            <Text style={styles.brand}>MEDEASY</Text>
            <Text style={styles.subText}>Эрүүл хүн ам</Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={styles.loginButtonText}>Нэвтрэх</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.85}
            >
              <Text style={styles.registerButtonText}>Бүртгүүлэх</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const PRIMARY = '#3F6EF6';
const SECONDARY = '#C9D8F3';
const BACKGROUND = '#ECECEC';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1F1F1F',
  },
  container: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    padding: 8,
  },
  card: {
    flex: 1,
    backgroundColor: BACKGROUND,
    borderRadius: 34,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 90,
    paddingBottom: 120,
    paddingHorizontal: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    marginTop: 40,
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 72,
    lineHeight: 78,
    color: PRIMARY,
    fontWeight: '800',
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: 0.4,
  },
  subText: {
    marginTop: 4,
    fontSize: 13,
    color: '#6A8AE8',
    fontWeight: '500',
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
  },
  loginButton: {
    width: '72%',
    height: 44,
    borderRadius: 24,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
  },
  registerButton: {
    width: '72%',
    height: 44,
    borderRadius: 24,
    backgroundColor: SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: PRIMARY,
    fontSize: 20,
    fontWeight: '500',
  },
});