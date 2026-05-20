import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';

export default function ResetPasswordFlowScreen({ navigation }) {
  const [step, setStep] = useState('method'); // method, phone, otp, newPassword, success
  const [mode, setMode] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const otpRefs = useRef([]);

  const goBackStep = () => {
    if (step === 'method') {
      navigation.goBack();
    } else if (step === 'phone') {
      setStep('method');
    } else if (step === 'otp') {
      setStep(mode === 'email' ? 'method' : 'phone');
    } else if (step === 'newPassword') {
      setStep('otp');
    } else if (step === 'success') {
      setStep('newPassword');
    }
  };

  const handleMethodContinue = () => {
    if (mode === 'email') {
      if (!email.trim()) {
        Alert.alert('Алдаа', 'Имэйлээ оруулна уу');
        return;
      }
      setStep('otp');
    } else {
      setStep('phone');
    }
  };

  const handlePhoneContinue = () => {
    if (!phone.trim()) {
      Alert.alert('Алдаа', 'Утасны дугаараа оруулна уу');
      return;
    }
    setStep('otp');
  };

  const handleOtpChange = (value, index) => {
    const clean = value.replace(/[^0-9]/g, '').slice(0, 1);
    const updated = [...otp];
    updated[index] = clean;
    setOtp(updated);

    if (clean && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpVerify = () => {
    const code = otp.join('');
    if (code.length !== 4) {
      Alert.alert('Алдаа', '4 оронтой кодоо бүтэн оруулна уу');
      return;
    }
    setStep('newPassword');
  };

  const handleCreatePassword = () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Алдаа', 'Бүх талбарыг бөглөнө үү');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Алдаа', 'Нууц үг таарахгүй байна');
      return;
    }

    setStep('success');
  };

  const maskedPhone = phone ? `${phone.slice(0, 3)}****${phone.slice(-2)}` : '948***00';

  const renderHeader = (title, showTitle = true) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={goBackStep} activeOpacity={0.7}>
        <Text style={styles.back}>{'‹'}</Text>
      </TouchableOpacity>
      {showTitle ? <Text style={styles.headerTitle}>{title}</Text> : <View />}
      <Text style={styles.settings}>✦</Text>
    </View>
  );

  if (step === 'method') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {renderHeader('Нууц үг сэргээх')}

          <Text style={styles.desc}>
            Имэйл эсвэл утасны дугаараа оруулна уу, бид танд баталгаажуулах код илгээх болно
          </Text>

          <View style={styles.tabWrap}>
            <TouchableOpacity
              style={[styles.tabButton, mode === 'email' && styles.activeTab]}
              onPress={() => setMode('email')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'email' && styles.activeTabText]}>
                Имэйл
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, mode === 'phone' && styles.activeTab]}
              onPress={() => setMode('phone')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'phone' && styles.activeTabText]}>
                Утас
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'email' ? (
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="jamesschleifer@gmail.com"
                placeholderTextColor="#A0A7B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          ) : (
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="085281882151"
                placeholderTextColor="#A0A7B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleMethodContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Нууц үг шинэчлэх</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'phone') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {renderHeader('Нууц үг сэргээх')}

          <Text style={styles.desc}>
            Имэйл эсвэл утасны дугаараа оруулна уу, бид танд баталгаажуулах код илгээх болно
          </Text>

          <View style={styles.tabWrap}>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => {
                setMode('email');
                setStep('method');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.tabText}>Имэйл</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, styles.activeTab]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, styles.activeTabText]}>Утас</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="085281882151"
              placeholderTextColor="#A0A7B8"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handlePhoneContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Нууц үг шинэчлэх</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'otp') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {renderHeader('', false)}

          <Text style={styles.otpTitle}>Баталгаажуулах кодыг оруулна уу</Text>
          <Text style={styles.otpDesc}>
            Таны {mode === 'phone' ? maskedPhone : '948***00'} дугаарт илгээсэн кодыг оруулна уу
          </Text>

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (otpRefs.current[index] = ref)}
                style={[styles.otpInput, digit ? styles.otpInputActive : null]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleOtpKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleOtpVerify}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Баталгаажуулах</Text>
          </TouchableOpacity>

          <Text style={styles.resendText}>
            Код хүлээн аваагүй юу? <Text style={styles.resendLink}>Илгээх</Text>
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'newPassword') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {renderHeader('', false)}

          <Text style={styles.newPassTitle}>Шинэ нууц үг</Text>
          <Text style={styles.newPassDesc}>
            Нэвтрэхийн тулд шинэ нууц үг үүсгэнэ үү
          </Text>

          <View style={styles.passwordInputWrap}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#A0A7B8"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <Text style={styles.eye}>◉</Text>
          </View>

          <View style={styles.passwordInputWrap}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Нууц үгийг баталгаажуулах"
              placeholderTextColor="#A0A7B8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <Text style={styles.eye}>◉</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCreatePassword}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Нууц үг үүсгэх</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.successSafeArea}>
      <View style={styles.successOverlay}>
        <View style={styles.successCard}>
          <View style={styles.successIconCircle}>
            <Text style={styles.successCheck}>✓</Text>
          </View>

          <Text style={styles.successTitle}>Амжилттай</Text>
          <Text style={styles.successDesc}>
            Таны нууц үг амжилттай шинэчлэгдлээ.
          </Text>

          <TouchableOpacity
            style={styles.successButton}
            onPress={() => navigation.replace('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.successButtonText}>Нэвтрэх</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const PRIMARY = '#2F62E8';
const BG = '#F2F2F2';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  back: {
    width: 24,
    fontSize: 20,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#21406A',
  },
  settings: {
    width: 24,
    textAlign: 'right',
    fontSize: 12,
    color: '#111827',
  },
  desc: {
    fontSize: 13,
    lineHeight: 20,
    color: '#9CA3AF',
    marginBottom: 22,
  },
  tabWrap: {
    flexDirection: 'row',
    backgroundColor: '#ECEDEF',
    borderRadius: 20,
    padding: 3,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    height: 30,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  activeTabText: {
    color: PRIMARY,
    fontWeight: '700',
  },
  inputWrap: {
    height: 40,
    borderRadius: 14,
    backgroundColor: '#E8EDF8',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  input: {
    fontSize: 13,
    color: '#1E293B',
  },
  primaryButton: {
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  otpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  otpDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: '#9CA3AF',
    marginBottom: 28,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  otpInput: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#ECEDEF',
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    borderWidth: 1.5,
    borderColor: '#ECEDEF',
  },
  otpInputActive: {
    backgroundColor: '#FFFFFF',
    borderColor: PRIMARY,
  },
  resendText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 16,
  },
  resendLink: {
    color: PRIMARY,
    fontWeight: '700',
  },
  newPassTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  newPassDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: '#9CA3AF',
    marginBottom: 18,
  },
  passwordInputWrap: {
    height: 40,
    borderRadius: 14,
    backgroundColor: '#ECEDEF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },
  eye: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  successSafeArea: {
    flex: 1,
    backgroundColor: '#D9D9D9',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successCard: {
    width: '86%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    alignItems: 'center',
    paddingVertical: 38,
    paddingHorizontal: 22,
  },
  successIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  successCheck: {
    fontSize: 34,
    color: PRIMARY,
    fontWeight: '700',
    lineHeight: 38,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 13,
    color: '#A0A7B8',
    textAlign: 'center',
    marginBottom: 26,
  },
  successButton: {
    width: '72%',
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});