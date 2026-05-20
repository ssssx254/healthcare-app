import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import AuthInput from '../components/AuthInput';

export default function ForgotPasswordScreen({ navigation }) {
  const [phone, setPhone] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Нууц үг сэргээх</Text>

      <Text style={styles.label}>Утасны дугаар</Text>
      <AuthInput
        placeholder=".........."
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Код авах</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.back}>Буцах</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const PRIMARY = '#2F62E8';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    marginBottom: 6,
  },
  button: {
    backgroundColor: PRIMARY,
    padding: 10,
    borderRadius: 18,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  back: {
    marginTop: 16,
    textAlign: 'center',
    color: '#6B7280',
  },
});
