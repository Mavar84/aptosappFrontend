import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  ScrollView,
  ImageBackground,
} from 'react-native';
import axios from 'axios';
import CONFIG from './config';
export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    correo: '',
    clave: '',
    nombre: '',
    p_apellido: '',
    s_apellido: '',
    celular: '',
    rol: 'usuario',
    activo: true,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  const showModal = (message, type = 'success') => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.timing(scaleAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setModalVisible(false);
        if (type === 'success') navigation.navigate('Home');
      });
    }, 2200);
  };

  const validarCorreo = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  const validarCelular = (cel) => /^[0-9]{8,}$/.test(cel);

  const handleRegister = async () => {
    if (!form.nombre || !form.p_apellido || !form.correo || !form.clave || !form.celular) {
      showModal('Complete todos los campos obligatorios', 'error');
      return;
    }

    if (!validarCorreo(form.correo)) {
      showModal('Ingrese un correo electrónico válido', 'error');
      return;
    }

    if (!validarCelular(form.celular)) {
      showModal('Ingrese un número de celular válido (mínimo 8 dígitos)', 'error');
      return;
    }

    if (form.clave.length < 8) {
      showModal('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }

    try {
      const res = await axios.post(`${CONFIG.API_URL}/usuarios/registro`, form);
      showModal('Usuario registrado correctamente', 'success');
    } catch (error) {
      console.log('Error:', error.response?.data || error.message);
      showModal('No se pudo registrar el usuario', 'error');
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.header}>Registro de Usuario</Text>

        <TextInput placeholder="Nombre" style={styles.input} onChangeText={(v) => handleChange('nombre', v)} />
        <TextInput placeholder="Primer Apellido" style={styles.input} onChangeText={(v) => handleChange('p_apellido', v)} />
        <TextInput placeholder="Segundo Apellido" style={styles.input} onChangeText={(v) => handleChange('s_apellido', v)} />
        <TextInput placeholder="Correo electrónico" style={styles.input} keyboardType="email-address" onChangeText={(v) => handleChange('correo', v)} />
        <TextInput placeholder="Celular" style={styles.input} keyboardType="phone-pad" onChangeText={(v) => handleChange('celular', v)} />
        <TextInput placeholder="Contraseña (mínimo 8 caracteres)" secureTextEntry style={styles.input} onChangeText={(v) => handleChange('clave', v)} />

        <TouchableOpacity style={styles.btn} onPress={handleRegister}>
          <Text style={styles.btnText}>Registrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>← Volver</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal */}
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
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 41, 59, 0.7)', // filtro oscuro
  },
  form: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  header: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  input: {
    width: '90%',
    backgroundColor: '#ffffffcc',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
  },
  btn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginTop: 20,
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  link: { color: '#93c5fd', marginTop: 20 },

  // Modal
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
