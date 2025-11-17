import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ImageBackground,
  Image,
  Switch,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import CONFIG from './config';
export default function EditarContrato({ route, navigation }) {
  const { id_contrato } = route.params;

  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalMsg, setModalMsg] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [currentDateField, setCurrentDateField] = useState('');
  const [tempDate, setTempDate] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [subiendo, setSubiendo] = useState(false);

  const showModal = (msg) => {
    setModalMsg(msg);
    setModalVisible(true);
  };

  const handleChange = (campo, valor) => setContrato((prev) => ({ ...prev, [campo]: valor }));
  const handleNumericChange = (campo, valor) =>
    handleChange(campo, valor.replace(/[^0-9]/g, ''));

  const openDateModal = (campo) => {
    setCurrentDateField(campo);
    setTempDate(contrato[campo]?.split('T')[0] || '');
    setDateModalVisible(true);
  };

  const confirmDate = () => {
    handleChange(currentDateField, tempDate);
    setDateModalVisible(false);
  };

  const validar = () => {
    const campos = [
      'id_apartamento',
      'fecha_formalizacion',
      'fecha_inicio',
      'fecha_fin',
      'monto_mensual_inicial',
      'monto_deposito_inicial',
      'cantidad_personas',
      'cantidad_mascotas',
      'dia_pago_mes',
      'dia_pago_agua',
      'dia_pago_luz',
      'fecha_maxima_pago_deposito',
      'estado',
    ];
    for (let campo of campos) {
      if (!contrato[campo] && contrato[campo] !== 0) {
        showModal(`⚠️ El campo ${campo.replace(/_/g, ' ')} es obligatorio.`);
        return false;
      }
    }
    return true;
  };

  const cargarContrato = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const resp = await axios.get(`${CONFIG.API_URL}/contratos/${id_contrato}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContrato(resp.data);
    } catch (e) {
      console.log('Error al cargar contrato:', e.response?.data || e.message);
      showModal('❌ Error al cargar el contrato.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarContrato();
  }, []);

  const guardarCambios = async () => {
    if (!validar()) return;
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${CONFIG.API_URL}/contratos/${id_contrato}`, contrato, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showModal('✅ Contrato actualizado correctamente.');
    } catch (e) {
      console.log('Error al actualizar contrato:', e.response?.data || e.message);
      showModal('❌ No se pudo actualizar el contrato.');
    } finally {
      setSaving(false);
    }
  };

  const seleccionarImagenes = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      showModal('⚠️ Debe otorgar permiso para acceder a la galería.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.6,
    });

    if (!resultado.canceled) {
      const nuevas = resultado.assets.map((a) => `data:image/jpeg;base64,${a.base64}`);
      setImagenes((prev) => [...prev, ...nuevas]);
    }
  };

  const subirImagenes = async () => {
    if (imagenes.length === 0) {
      showModal('⚠️ No hay imágenes seleccionadas.');
      return;
    }
    setSubiendo(true);
    try {
      const token = await AsyncStorage.getItem('token');
      for (const img of imagenes) {
        const foto = { contexto: 'Fotos de contrato', base64_parte1: img };
        await axios.post(`${CONFIG.API_URL}/fotos/contrato/${id_contrato}`, foto, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      showModal('✅ Imágenes subidas y asociadas correctamente.');
      setImagenes([]);
    } catch (e) {
      console.log('Error al subir imágenes:', e.response?.data || e.message);
      showModal('❌ Error al subir las imágenes.');
    } finally {
      setSubiendo(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: '#0f172a' }]}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      }}
      style={styles.background}
    >
      <View style={styles.overlay} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 180 }}>
        <Text style={styles.header}>Editar Contrato #{id_contrato}</Text>

        {contrato ? (
          <View style={styles.form}>
            {/* Fechas en dos columnas */}
            <View style={styles.row}>
              <View style={styles.col}>
                <TouchableOpacity onPress={() => openDateModal('fecha_formalizacion')}>
                  <Text style={styles.label}>Formalización*</Text>
                  <Text style={styles.dateField}>
                    {contrato.fecha_formalizacion?.split('T')[0] || ''}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.col}>
                <TouchableOpacity onPress={() => openDateModal('fecha_inicio')}>
                  <Text style={styles.label}>Inicio*</Text>
                  <Text style={styles.dateField}>{contrato.fecha_inicio?.split('T')[0] || ''}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <TouchableOpacity onPress={() => openDateModal('fecha_fin')}>
                  <Text style={styles.label}>Fin*</Text>
                  <Text style={styles.dateField}>{contrato.fecha_fin?.split('T')[0] || ''}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.col}>
                <TouchableOpacity onPress={() => openDateModal('fecha_maxima_pago_deposito')}>
                  <Text style={styles.label}>Máx. pago depósito*</Text>
                  <Text style={styles.dateField}>
                    {contrato.fecha_maxima_pago_deposito?.split('T')[0] || ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Campos numéricos */}
            <Text style={styles.label}>ID Apartamento*</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(contrato.id_apartamento || '')}
              onChangeText={(t) => handleNumericChange('id_apartamento', t)}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Monto mensual*</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(contrato.monto_mensual_inicial || '')}
                  onChangeText={(t) => handleNumericChange('monto_mensual_inicial', t)}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Depósito*</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(contrato.monto_deposito_inicial || '')}
                  onChangeText={(t) => handleNumericChange('monto_deposito_inicial', t)}
                />
              </View>
            </View>

            {/* Switches con texto */}
            {[
              { campo: 'recibos_incluidos', label: 'Recibos incluidos' },
              { campo: 'incluye_cable', label: 'Incluye cable' },
              { campo: 'incluye_internet', label: 'Incluye internet' },
              { campo: 'incluye_parqueo', label: 'Incluye parqueo' },
            ].map(({ campo, label }) => (
              <View key={campo} style={styles.switchRow}>
                <Text style={styles.label}>{label}</Text>
                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>{contrato[campo] ? 'Sí' : 'No'}</Text>
                  <Switch
                    value={!!contrato[campo]}
                    onValueChange={(v) => handleChange(campo, v)}
                    trackColor={{ false: '#64748b', true: '#60a5fa' }}
                    thumbColor={contrato[campo] ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>
            ))}

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Personas*</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(contrato.cantidad_personas || '')}
                  onChangeText={(t) => handleNumericChange('cantidad_personas', t)}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Mascotas*</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(contrato.cantidad_mascotas || '')}
                  onChangeText={(t) => handleNumericChange('cantidad_mascotas', t)}
                />
              </View>
            </View>

            <Text style={styles.label}>Otros detalles</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              multiline
              value={contrato.otros_detalles || ''}
              onChangeText={(t) => handleChange('otros_detalles', t)}
            />

            {/* Imágenes */}
            <Text style={[styles.label, { marginTop: 15 }]}>📸 Fotos de contrato</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btnSmall, styles.btnPrimary]} onPress={seleccionarImagenes}>
                <Text style={styles.btnTextSmall}>Seleccionar imágenes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSmall, subiendo ? styles.btnDisabled : styles.btnSecondary]}
                onPress={subirImagenes}
                disabled={subiendo}
              >
                {subiendo ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextSmall}>Subir imágenes</Text>}
              </TouchableOpacity>
            </View>

            {imagenes.length > 0 && (
              <ScrollView horizontal style={{ marginTop: 10 }}>
                {imagenes.map((img, i) => (
                  <Image key={i} source={{ uri: img }} style={styles.preview} />
                ))}
              </ScrollView>
            )}

            {/* Botones finales */}
            <TouchableOpacity
              style={[styles.btn, saving ? styles.btnDisabled : styles.btnPrimary]}
              onPress={guardarCambios}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar cambios</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => navigation.goBack()}>
              <Text style={styles.btnText}>⬅️ Volver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary, { marginTop: 10 }]}
              onPress={() => navigation.navigate('Menu')}
            >
              <Text style={styles.btnText}>🏠 Volver al menú</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.noData}>No se pudo cargar el contrato.</Text>
        )}
      </ScrollView>

      {/* Modal mensaje */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{modalMsg}</Text>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => setModalVisible(false)}>
              <Text style={styles.btnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal fecha */}
      <Modal visible={dateModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Seleccione una fecha</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                style={{
                  padding: 8,
                  fontSize: 16,
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  width: '90%',
                  marginBottom: 10,
                }}
              />
            ) : (
              <TextInput
                style={styles.input}
                value={tempDate}
                onChangeText={setTempDate}
                placeholder="YYYY-MM-DD"
              />
            )}
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={confirmDate}>
              <Text style={styles.btnText}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setDateModalVisible(false)}>
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.85)' },
  container: { flex: 1, padding: 20 },
  header: { color: '#fff', fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  form: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, padding: 15 },
  label: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
  },
  dateField: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  col: { flex: 1 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  switchContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  switchText: { color: '#fff', fontSize: 14 },
  btn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginVertical: 8 },
  btnSmall: { paddingVertical: 10, borderRadius: 10, alignItems: 'center', flex: 1 },
  btnPrimary: { backgroundColor: '#3b82f6' },
  btnSecondary: { backgroundColor: '#64748b' },
  btnDisabled: { backgroundColor: '#475569' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnTextSmall: { color: '#fff', fontSize: 13, fontWeight: '600' },
  preview: { width: 90, height: 90, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: '#fff' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#1e293b', padding: 20, borderRadius: 14, width: '85%', alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  noData: { color: '#fff', textAlign: 'center', fontSize: 16, marginTop: 20 },
  center: { justifyContent: 'center', alignItems: 'center' },
});
