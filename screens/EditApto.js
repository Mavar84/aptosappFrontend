import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import CONFIG from './config';
export default function EditApto({ route, navigation }) {
  const { id_apto } = route.params;

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
    tiene_ducha: false,
    num_220: '',
    num_closet: '',
    num_mueble_cocina: '',
    direccion_fisica: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    cargarApto();
  }, []);

  const cargarApto = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${CONFIG.API_URL}/apartamentos/${id_apto}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      setForm({
        nombre: data.nombre || '',
        tamanno_m2: String(data.tamanno_m2 || ''),
        ejex: String(data.ejex || ''),
        ejey: String(data.ejey || ''),
        num_piso: String(data.num_piso || ''),
        num_cuartos: String(data.num_cuartos || ''),
        num_bannos: String(data.num_bannos || ''),
        num_pilas: String(data.num_pilas || ''),
        num_salas: String(data.num_salas || ''),
        num_cocina: String(data.num_cocina || ''),
        num_comedor: String(data.num_comedor || ''),
        color_interno: data.color_interno || '',
        color_externo: data.color_externo || '',
        num_ventanas: String(data.num_ventanas || ''),
        tiene_ducha: data.tiene_ducha || false,
        num_220: String(data.num_220 || ''),
        num_closet: String(data.num_closet || ''),
        num_mueble_cocina: String(data.num_mueble_cocina || ''),
        direccion_fisica: data.direccion_fisica || '',
      });
    } catch (e) {
      console.log('Error al cargar apartamento:', e.response?.data || e.message);
      Alert.alert('Error', 'No se pudo cargar la información del apartamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const validarCampos = () => {
    const sinValidar = { tiene_ducha: true };
    return Object.entries(form).every(([k, v]) => sinValidar[k] || (v !== '' && v !== null));
  };

  const actualizarApto = async () => {
    if (!validarCampos()) {
      Alert.alert('Campos requeridos', 'Debe completar todos los campos.');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const payload = {
        nombre: form.nombre.trim(),
        tamanno_m2: parseFloat(form.tamanno_m2),
        ejex: parseFloat(form.ejex),
        ejey: parseFloat(form.ejey),
        num_piso: parseInt(form.num_piso),
        num_cuartos: parseInt(form.num_cuartos),
        num_bannos: parseInt(form.num_bannos),
        num_pilas: parseInt(form.num_pilas),
        num_salas: parseInt(form.num_salas),
        num_cocina: parseInt(form.num_cocina),
        num_comedor: parseInt(form.num_comedor),
        color_interno: form.color_interno.trim(),
        color_externo: form.color_externo.trim(),
        num_ventanas: parseInt(form.num_ventanas),
        tiene_ducha: !!form.tiene_ducha,
        num_220: parseInt(form.num_220),
        num_closet: parseInt(form.num_closet),
        num_mueble_cocina: parseInt(form.num_mueble_cocina),
        direccion_fisica: form.direccion_fisica.trim(),
      };

      await axios.put(`${CONFIG.API_URL}/apartamentos/${id_apto}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMsg('Apartamento actualizado correctamente.');
      setModalVisible(true);
    } catch (e) {
      console.log('Error al actualizar apartamento:', e.response?.data || e.message);
      Alert.alert('Error', 'No se pudo actualizar el apartamento.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1200&q=80',
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 150 }}>
        <Text style={styles.header}>Editar Apartamento</Text>

        {/* Campos de texto principales */}
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Nombre del apartamento</Text>
          <TextInput style={styles.input} value={form.nombre} onChangeText={(t) => handleChange('nombre', t)} />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Dirección física</Text>
          <TextInput
            style={[styles.input, { height: 70 }]}
            multiline
            value={form.direccion_fisica}
            onChangeText={(t) => handleChange('direccion_fisica', t)}
          />
        </View>

        {/* Grupo numérico en dos columnas */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Tamaño (m²)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={form.tamanno_m2}
              onChangeText={(t) => handleChange('tamanno_m2', t)}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Piso</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.num_piso}
              onChangeText={(t) => handleChange('num_piso', t)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Habitaciones</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.num_cuartos}
              onChangeText={(t) => handleChange('num_cuartos', t)}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Baños</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.num_bannos}
              onChangeText={(t) => handleChange('num_bannos', t)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Salas</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.num_salas}
              onChangeText={(t) => handleChange('num_salas', t)}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Comedores</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.num_comedor}
              onChangeText={(t) => handleChange('num_comedor', t)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Cocinas</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.num_cocina}
              onChangeText={(t) => handleChange('num_cocina', t)}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Pilas</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.num_pilas}
              onChangeText={(t) => handleChange('num_pilas', t)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Ventanas</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.num_ventanas}
              onChangeText={(t) => handleChange('num_ventanas', t)}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Tomas 220V</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.num_220}
              onChangeText={(t) => handleChange('num_220', t)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Closets</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.num_closet}
              onChangeText={(t) => handleChange('num_closet', t)}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Muebles cocina</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.num_mueble_cocina}
              onChangeText={(t) => handleChange('num_mueble_cocina', t)}
            />
          </View>
        </View>

        {/* Colores */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Color interno</Text>
            <TextInput
              style={styles.input}
              value={form.color_interno}
              onChangeText={(t) => handleChange('color_interno', t)}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Color externo</Text>
            <TextInput
              style={styles.input}
              value={form.color_externo}
              onChangeText={(t) => handleChange('color_externo', t)}
            />
          </View>
        </View>

        {/* Switch ducha */}
        <View style={styles.switchRow}>
          <Text style={styles.label}>Tiene ducha</Text>
          <Switch
            value={form.tiene_ducha}
            onValueChange={(v) => handleChange('tiene_ducha', v)}
            thumbColor={form.tiene_ducha ? '#10b981' : '#f87171'}
          />
        </View>

        {/* Botones */}
        <TouchableOpacity
          style={[styles.btn, saving ? styles.btnDisabled : styles.btnPrimary]}
          onPress={actualizarApto}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar cambios</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Cancelar y volver</Text>
        </TouchableOpacity>

        {/* Modal confirmación */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <Text style={styles.modalText}>{msg}</Text>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={() => {
                  setModalVisible(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.btnText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.75)' },
  container: { flex: 1, padding: 20 },
  header: { color: '#fff', fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },

  fieldBlock: { marginBottom: 15 },
  label: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
  },

  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  col: { flex: 1 },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },

  btn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginVertical: 8 },
  btnPrimary: { backgroundColor: '#3b82f6' },
  btnSecondary: { backgroundColor: '#64748b' },
  btnDisabled: { backgroundColor: '#475569' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 16 },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#1e293b',
    padding: 25,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
  },
  modalText: { color: '#fff', fontSize: 18, marginBottom: 20, textAlign: 'center' },
});
