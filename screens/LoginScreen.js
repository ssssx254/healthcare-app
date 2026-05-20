import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import AuthInput from '../components/AuthInput';
import SocialButtons from '../components/SocialButtons';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!phone || !password) {
      Alert.alert('Алдаа', 'Бүх талбарыг бөглөнө үү');
      return;
    }

    // ✅ зөв screen рүү явна
    navigation.replace('Success');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>{'‹'}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Нэвтрэх</Text>

          <Text style={styles.settings}>✦</Text>
        </View>

        {/* ✅ WELCOME-тэй ижил LOGO */}
        <View style={styles.logoWrap}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>✚</Text>
          </View>

          <Text style={styles.brand}>MEDEASY</Text>
          <Text style={styles.subText}>Эрүүл хүн ам</Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          <Text style={styles.label}>Утасны дугаар</Text>
          <AuthInput
            placeholder=".........."
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Нууц үг</Text>
          <AuthInput
            placeholder=".........."
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* ✅ Forgot password зөв */}
          <TouchableOpacity
            style={styles.forgotWrap}
            onPress={() => navigation.navigate('ResetPasswordFlow')}
          >
            <Text style={styles.forgotText}>Нууц үгээ мартсан</Text>
          </TouchableOpacity>

          {/* ✅ LOGIN BUTTON */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>Нэвтрэх</Text>
          </TouchableOpacity>

          <SocialButtons />

          {/* ✅ Register link зөв */}
          <TouchableOpacity
            style={styles.bottomWrap}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.bottomText}>
              Бүртгэл байхгүй юу?{' '}
              <Text style={styles.bottomLink}>Бүртгүүлэх</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const PRIMARY = '#2F62E8';
const BG = '#F7F9FC';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  back: {
    fontSize: 24,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#21406A',
  },
  settings: {
    fontSize: 14,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 60,
    color: PRIMARY,
    fontWeight: '800',
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: PRIMARY,
  },
  subText: {
    fontSize: 12,
    color: '#6A8AE8',
  },
  label: {
    fontSize: 13,
    marginBottom: 5,
  },
  forgotWrap: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  forgotText: {
    fontSize: 12,
    color: '#8A94A6',
  },
  button: {
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  bottomText: {
    fontSize: 12,
    color: '#8A94A6',
  },
  bottomLink: {
    color: PRIMARY,
    fontWeight: '700',
  },
});