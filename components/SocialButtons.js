import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function SocialButtons() {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.circle} activeOpacity={0.8}>
        <Text style={[styles.icon, { color: '#1877F2' }]}>f</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.circle} activeOpacity={0.8}>
        <Text style={[styles.icon, { color: '#EA4335' }]}>G</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.circle} activeOpacity={0.8}>
        <Text style={[styles.icon, { color: '#111827' }]}></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 10,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
  },
});