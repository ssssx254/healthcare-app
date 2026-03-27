import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>✚</Text>
        </View>

        <Text style={styles.brand}>MEDEASY</Text>
        <Text style={styles.subText}>Эрүүл мэндийн туслах систем</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2F62E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  iconText: {
    fontSize: 54,
    fontWeight: '700',
    color: '#2F62E8',
    lineHeight: 58,
  },
  brand: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
  },
});