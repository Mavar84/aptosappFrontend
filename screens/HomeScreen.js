import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen({ navigation }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Si hay token, ir directo al menú
        navigation.reset({
          index: 0,
          routes: [{ name: 'Menu' }],
        });
        return;
      }
    } catch (error) {
      console.log('Error verificando token:', error);
    } finally {
      setCheckingSession(false);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]).start();
    }
  };

  if (checkingSession) {
    return (
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
        }}
        style={styles.bg}
      >
        <View style={styles.overlay} />
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Verificando sesión...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
      }}
      style={styles.bg}
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          <Text style={styles.title}>AptosAdmin</Text>
          <Text style={styles.desc}>
            Sistema móvil para gestionar alquileres, contratos e inquilinos desde su celular.
          </Text>

          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.btnText}>Registrarse</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.btnText}>Ingresar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      <StatusBar style="light" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 25 },
  title: { color: '#fff', fontSize: 42, fontWeight: 'bold', marginBottom: 15 },
  desc: { color: '#eee', fontSize: 16, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  btn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 6,
    elevation: 5,
    marginVertical: 8,
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  loadingText: { color: '#fff', marginTop: 15, fontSize: 16 },
});
