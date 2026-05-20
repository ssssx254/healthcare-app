import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function OnboardingSlide({ item }) {
  return (
    <View style={styles.slide}>
      <View style={styles.topRow}>
        <Text style={styles.skipIcon}>✦</Text>
        <Text style={styles.appName}>Arraxx</Text>
      </View>

      <Image source={item.image} style={styles.image} resizeMode="contain" />

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    width,
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 110,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipIcon: {
    fontSize: 14,
    color: '#111827',
  },
  appName: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  image: {
    width: '100%',
    height: 260,
    marginTop: 24,
    marginBottom: 18,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#18457B',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 22,
    color: '#98A2B3',
    paddingHorizontal: 8,
  },
});