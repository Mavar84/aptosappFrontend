import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Switch,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import CONFIG from './config';
export default function NewApartmentScreen({ navigation }) {
  const [form, setForm] = useState({
    nombre: '',
    tamanno_m2: '',
    ejex: '',
    ejey: '',
    num_piso: '',
    num_cuartos: '',
    num_bannos: '',
    num_pilas: '',
    num_salas: '',
    num_cocina: '',
    num_comedor: '',
    color_interno: '',
    color_externo: '',
    num_ventanas: '',
    tiene_ducha: true,
    num_220: '',
    num_closet: '',
    num_mueble_cocina: '',
    direccion_fisica: '',
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // VALIDACIÓN ADAPTADA AL ESQUEMA
  const handleChangeText = (key, value, type = 'text') => {
    if (typeof value !== 'string') {
      setForm({ ...form, [key]: value });
      return;
    }

    let filtered = value;

    // Validaciones específicas según tipo del campo
    if (['num_piso', 'num_cuartos', 'num_bannos', 'num_pilas', 'num_salas', 'num_cocina',
         'num_comedor', 'num_ventanas', 'num_220', 'num_closet', 'num_mueble_cocina'].includes(key)) {
      // Solo números enteros
      filtered = value.replace(/[^0-9]/g, '');
    } 
    else if (['tamanno_m2', 'ejex', 'ejey'].includes(key)) {
      // Solo números con punto o coma decimal
      filtered = value.replace(/[^0-9.,]/g, '');
    } 
    else if (['nombre', 'color_interno', 'color_externo', 'direccion_fisica'].includes(key)) {
      // Texto libre (letras, números y espacios)
      filtered = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s.,#-]/g, '');
    }

    setForm({ ...form, [key]: filtered });
  };

  const showModal = (message, type = 'success') => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.timing(scaleAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setModalVisible(false);
        if (type === 'success') navigation.goBack();
      });
    }, 1800);
  };

  const validarCampos = () => {
    if (!form.nombre.trim()) return 'El campo "Nombre" es obligatorio.';
    if (!form.direccion_fisica.trim()) return 'La dirección física es obligatoria.';

    // Validar campos numéricos
    const numerosEnteros = ['num_piso', 'num_cuartos', 'num_bannos', 'num_pilas', 'num_salas',
      'num_cocina', 'num_comedor', 'num_ventanas', 'num_220', 'num_closet', 'num_mueble_cocina'];
    for (let campo of numerosEnteros) {
      if (form[campo] && isNaN(parseInt(form[campo]))) {
        return `El campo "${campo.replace('_', ' ')}" debe ser numérico.`;
      }
    }

    // Validar campos decimales
    const decimales = ['tamanno_m2', 'ejex', 'ejey'];
    for (let campo of decimales) {
      if (form[campo] && isNaN(parseFloat(form[campo].replace(',', '.')))) {
        return `El campo "${campo.replace('_', ' ')}" debe tener un valor decimal válido.`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    const error = validarCampos();
    if (error) {
      showModal(error, 'error');
      return;
    }

    const payload = Object.fromEntries(
      Object.entries({
        ...form,
        tamanno_m2: form.tamanno_m2 ? parseFloat(form.tamanno_m2.replace(',', '.')) : undefined,
        ejex: form.ejex ? parseFloat(form.ejex.replace(',', '.')) : undefined,
        ejey: form.ejey ? parseFloat(form.ejey.replace(',', '.')) : undefined,
        num_piso: form.num_piso ? parseInt(form.num_piso) : undefined,
        num_cuartos: form.num_cuartos ? parseInt(form.num_cuartos) : undefined,
        num_bannos: form.num_bannos ? parseInt(form.num_bannos) : undefined,
        num_pilas: form.num_pilas ? parseInt(form.num_pilas) : undefined,
        num_salas: form.num_salas ? parseInt(form.num_salas) : undefined,
        num_cocina: form.num_cocina ? parseInt(form.num_cocina) : undefined,
        num_comedor: form.num_comedor ? parseInt(form.num_comedor) : undefined,
        num_ventanas: form.num_ventanas ? parseInt(form.num_ventanas) : undefined,
        num_220: form.num_220 ? parseInt(form.num_220) : undefined,
        num_closet: form.num_closet ? parseInt(form.num_closet) : undefined,
        num_mueble_cocina: form.num_mueble_cocina ? parseInt(form.num_mueble_cocina) : undefined,
      }).filter(([_, v]) => v !== '' && v !== undefined)
    );

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showModal('Debe iniciar sesión nuevamente', 'error');
        navigation.navigate('Login');
        return;
      }

      const res = await axios.post(`${CONFIG.API_URL}/apartamentos/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.id || res.data?.[0]?.id) {
        const id_apto = res.data.id || res.data[0].id;
        navigation.navigate('AddApartmentPhotos', { id_apto });
      } else {
        showModal('Apartamento creado (sin ID devuelto)', 'success');
      }
    } catch (e) {
      console.log('Error al guardar apartamento:', e.response?.data || e.message);
      showModal('Error al registrar el apartamento', 'error');
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1502673530728-f79b4cab31b1?auto=format&fit=crop&w=1200&q=80',
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>Nuevo Apartamento</Text>

          <View style={styles.card}>
            <TextInput placeholder="Nombre *" placeholderTextColor="#cbd5e1" style={styles.input}
              value={form.nombre} onChangeText={(v) => handleChangeText('nombre', v)} />

            <TextInput placeholder="Tamaño (m²)" placeholderTextColor="#cbd5e1" style={styles.input}
              keyboardType="decimal-pad" value={form.tamanno_m2}
              onChangeText={(v) => handleChangeText('tamanno_m2', v)} />

            <View style={styles.row}>
              <TextInput placeholder="Eje X" placeholderTextColor="#cbd5e1"
                style={[styles.input, styles.half]} keyboardType="decimal-pad"
                value={form.ejex} onChangeText={(v) => handleChangeText('ejex', v)} />
              <TextInput placeholder="Eje Y" placeholderTextColor="#cbd5e1"
                style={[styles.input, styles.half]} keyboardType="decimal-pad"
                value={form.ejey} onChangeText={(v) => handleChangeText('ejey', v)} />
            </View>

            <View style={styles.row}>
              <TextInput placeholder="Piso" placeholderTextColor="#cbd5e1"
                style={[styles.input, styles.half]} keyboardType="number-pad"
                value={form.num_piso} onChangeText={(v) => handleChangeText('num_piso', v)} />
              <TextInput placeholder="Cuartos" placeholderTextColor="#cbd5e1"
                style={[styles.input, styles.half]} keyboardType="number-pad"
                value={form.num_cuartos} onChangeText={(v) => handleChangeText('num_cuartos', v)} />
            </View>

            <View style={styles.row}>
              <TextInput placeholder="Baños" placeholderTextColor="#cbd5e1"
                style={[styles.input, styles.half]} keyboardType="number-pad"
                value={form.num_bannos} onChangeText={(v) => handleChangeText('num_bannos', v)} />
              <TextInput placeholder="Pilas" placeholderTextColor="#cbd5e1"
                style={[styles.input, styles.half]} keyboardType="number-pad"
                value={form.num_pilas} onChangeText={(v) => handleChangeText('num_pilas', v)} />
            </View>

            <View style={styles.row}>
              <TextInput placeholder="Salas" placeholderTextColor="#cbd5e1"
                style={[styles.input, styles.half]} keyboardType="number-pad"
                value={form.num_salas} onChangeText={(v) => handleChangeText('num_salas', v)} />
              <TextInput placeholder="Cocinas" placeholderTextColor="#cbd5e1"
                style={[styles.input, styles.half]} keyboardType="number-pad"
                value={form.num_cocina} onChangeText={(v) => handleChangeText('num_cocina', v)} />
            </View>

            <View style={styles.row}>
              <TextInput placeholder="Comedores" placeholderTextColor="#cbd5e1"
                style={[styles.input, styles.half]} keyboardType="number-pad"
                value={form.num_comedor} onChangeText={(v) => handleChangeText('num_comedor', v)} />
              <TextInput placeholder="Ventanas" placeholderTextColor="#cbd5e1"
                style={[styles.input, styles.half]} keyboardType="number-pad"
                value={form.num_ventanas} onChangeText={(v) => handleChangeText('num_ventanas', v)} />
            </View>

            <View style={styles.row}>
              <TextInput placeholder="Tomacorrientes 220V" placeholderTextColor="#cbd5e1"
                style={[styles.input, styles.half]} keyboardType="number-pad"
                value={form.num_220} onChangeText={(v) => handleChangeText('num_220', v)} />
              <TextInput placeholder="Closets" placeholderTextColor="#cbd5e1"
                style={[styles.input, styles.half]} keyboardType="number-pad"
                value={form.num_closet} onChangeText={(v) => handleChangeText('num_closet', v)} />
            </View>

            <View style={styles.row}>
              <TextInput placeholder="Muebles de cocina" placeholderTextColor="#cbd5e1"
                style={[styles.input, styles.half]} keyboardType="number-pad"
                value={form.num_mueble_cocina} onChangeText={(v) => handleChangeText('num_mueble_cocina', v)} />
              <View style={[styles.switchContainer, styles.half]}>
                <Text style={styles.switchLabel}>Tiene ducha</Text>
                <Switch
                  value={form.tiene_ducha}
                  onValueChange={(v) => handleChangeText('tiene_ducha', v)}
                  thumbColor={form.tiene_ducha ? '#fff' : '#e2e8f0'}
                  trackColor={{ false: '#94a3b8', true: '#3b82f6' }}
                />
              </View>
            </View>

            <TextInput placeholder="Color interno" placeholderTextColor="#cbd5e1"
              style={styles.input} value={form.color_interno}
              onChangeText={(v) => handleChangeText('color_interno', v)} />

            <TextInput placeholder="Color externo" placeholderTextColor="#cbd5e1"
              style={styles.input} value={form.color_externo}
              onChangeText={(v) => handleChangeText('color_externo', v)} />

            <TextInput placeholder="Dirección física *" placeholderTextColor="#cbd5e1"
              style={[styles.input, { height: 80 }]} multiline
              value={form.direccion_fisica}
              onChangeText={(v) => handleChangeText('direccion_fisica', v)} />

            <TouchableOpacity style={styles.btn} onPress={handleSave}>
              <Text style={styles.btnText}>Guardar Apartamento</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.link}>← Volver</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.7)' },
  container: { flexGrow: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  header: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    width: '95%',
    padding: 15,
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginVertical: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginVertical: 6,
    height: 48,
  },
  switchLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  link: { color: '#93c5fd', marginTop: 10, textAlign: 'center' },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: { padding: 20, borderRadius: 16, minWidth: '70%', alignItems: 'center' },
  modalSuccess: { backgroundColor: '#10b981' },
  modalError: { backgroundColor: '#ef4444' },
  modalText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
