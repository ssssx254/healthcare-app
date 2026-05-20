import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';

export default function AuthInput({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
}) {
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#A7B0C2"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={hidden}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />

      {secureTextEntry && (
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setHidden(!hidden)}
          activeOpacity={0.7}
        >
          <Text style={styles.eyeText}>⌕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: 34,
    backgroundColor: '#E8EDF8',
    borderRadius: 8,
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 11,
    color: '#23395D',
  },
  eyeButton: {
    position: 'absolute',
    right: 8,
    top: 7,
  },
  eyeText: {
    fontSize: 12,
    color: '#98A2B3',
  },
});