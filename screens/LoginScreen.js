import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import CONFIG from './config';
export default function LoginScreen({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const showModal = (message, type = 'success') => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.timing(scaleAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setModalVisible(false);
        if (type === 'success') navigation.navigate('Menu');
      });
    }, 2000);
  };

  const validarCorreo = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

  const handleLogin = async () => {
    if (!correo || !clave) {
      showModal('Debe ingresar correo y contraseña', 'error');
      return;
    }

    if (!validarCorreo(correo)) {
      showModal('Ingrese un correo electrónico válido', 'error');
      return;
    }

    try {
      const response = await axios.post(`${CONFIG.API_URL}/auth/login`, { correo, clave });

      if (response.data?.access_token) {
        const token = response.data.access_token;

        // Guardamos token y datos del usuario localmente
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('usuario', JSON.stringify(response.data.usuario));

        console.log('Token guardado correctamente');
        showModal('Inicio de sesión exitoso', 'success');
      } else {
        showModal('Credenciales incorrectas', 'error');
      }
    } catch (error) {
      console.log('Error:', error.response?.data || error.message);
      showModal('Credenciales inválidas o error en el servidor', 'error');
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.container}>
        <Text style={styles.header}>Iniciar Sesión</Text>

        <TextInput
          placeholder="Correo electrónico"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={setCorreo}
          value={correo}
        />
        <TextInput
          placeholder="Contraseña"
          secureTextEntry
          style={styles.input}
          onChangeText={setClave}
          value={clave}
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin}>
          <Text style={styles.btnText}>Ingresar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>¿No tiene cuenta? Regístrese</Text>
        </TouchableOpacity>
      </View>

      {/* Modal animado */}
      <Modal visible={modalVisible} transparent animationType="none">
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.modalBox,
              modalType === 'success' ? styles.modalSuccess : styles.modalError,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.modalText}>{modalMessage}</Text>
          </Animated.View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30,41,59,0.7)' },
  container: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  header: { color: '#fff', fontSize: 30, fontWeight: 'bold', marginBottom: 30 },
  input: {
    width: '90%',
    backgroundColor: '#ffffffcc',
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
    fontSize: 16,
  },
  btn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 70,
    borderRadius: 30,
    marginTop: 25,
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  link: { color: '#93c5fd', marginTop: 25, textDecorationLine: 'underline' },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    padding: 25,
    borderRadius: 20,
    minWidth: '70%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  modalSuccess: { backgroundColor: '#10b981' },
  modalError: { backgroundColor: '#ef4444' },
  modalText: { color: '#fff', fontSize: 18, textAlign: 'center', fontWeight: '600' },
});
