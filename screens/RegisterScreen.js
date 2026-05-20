import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import AuthInput from '../components/AuthInput';
import SocialButtons from '../components/SocialButtons';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [agree, setAgree] = useState(false);

  const handleRegister = () => {
    if (!name || !password || !email || !phone || !birthDate) {
      Alert.alert('Алдаа', 'Бүх талбарыг бөглөнө үү');
      return;
    }

    if (!agree) {
      Alert.alert('Алдаа', 'Нөхцөлийг зөвшөөрнө үү');
      return;
    }

    navigation.replace('Success');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.back}>{'‹'}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Бүртгүүлэх</Text>
          <Text style={styles.settings}>✦</Text>
        </View>

        <View style={styles.logoWrap}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>✚</Text>
          </View>
          <Text style={styles.brand}>MEDEASY</Text>
          <Text style={styles.subText}>Эрүүл хүн ам</Text>
        </View>

        <Text style={styles.label}>Нэр</Text>
        <AuthInput
          placeholder="Нэрээ оруулна уу"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Нууц үг</Text>
        <AuthInput
          placeholder=".........."
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>И-мэйл хаяг</Text>
        <AuthInput
          placeholder="example@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={styles.label}>Утасны дугаар</Text>
        <AuthInput
          placeholder="0800000000"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Төрсөн огноо</Text>
        <AuthInput
          placeholder="DD / MM / YYYY"
          value={birthDate}
          onChangeText={setBirthDate}
        />

        <View style={styles.agreeRow}>
          <TouchableOpacity onPress={() => setAgree(!agree)} activeOpacity={0.7}>
            <Text style={styles.check}>{agree ? '☑' : '☐'}</Text>
          </TouchableOpacity>
          <Text style={styles.agreeText}>
            Үйлчилгээний нөхцөл болон нууцлалын бодлогыг зөвшөөрч байна
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Бүртгүүлэх</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>эсвэл</Text>

        <SocialButtons />

        <TouchableOpacity
          style={styles.bottomWrap}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.bottomText}>
            Аль хэдийн бүртгэлтэй юу?{' '}
            <Text style={styles.bottomLink}>Нэвтрэх</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  back: {
    width: 24,
    fontSize: 24,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#21406A',
  },
  settings: {
    width: 24,
    textAlign: 'right',
    fontSize: 14,
    color: '#111827',
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  iconText: {
    fontSize: 58,
    color: PRIMARY,
    fontWeight: '800',
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: 0.4,
  },
  subText: {
    marginTop: 2,
    fontSize: 12,
    color: '#6A8AE8',
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 6,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
    marginBottom: 14,
  },
  check: {
    marginRight: 8,
    fontSize: 16,
    color: '#111827',
    marginTop: 1,
  },
  agreeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#8A94A6',
  },
  button: {
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  orText: {
    textAlign: 'center',
    color: '#A0A7B8',
    fontSize: 12,
    marginTop: 10,
  },
  bottomWrap: {
    alignItems: 'center',
    marginTop: 14,
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