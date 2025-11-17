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
  FlatList,
  ImageBackground,
  Switch,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import CONFIG from './config';
export default function NuevoContrato({ navigation }) {
  const [apartamentos, setApartamentos] = useState([]);
  const [selectedApto, setSelectedApto] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [currentDateField, setCurrentDateField] = useState(null);
  const [tempDate, setTempDate] = useState('');

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const [form, setForm] = useState({
    fecha_formalizacion: today,
    fecha_inicio: today,
    fecha_fin: today,
    monto_mensual_inicial: '0',
    monto_deposito_inicial: '0',
    recibos_incluidos: false,
    incluye_cable: false,
    incluye_internet: false,
    incluye_parqueo: false,
    cantidad_personas: '0',
    cantidad_mascotas: '0',
    dia_pago_mes: '0',
    fecha_maxima_pago_deposito: today,
    dia_pago_agua: '0',
    dia_pago_luz: '0',
    estado: 1,
    otros_detalles: '',
  });

  useEffect(() => {
    cargarApartamentos();
  }, []);

  const cargarApartamentos = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const [resAptos, resContratos] = await Promise.all([
        axios.get(`${CONFIG.API_URL}/apartamentos/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${CONFIG.API_URL}/contratos/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const contratosActivos = resContratos.data.filter((c) => c.estado === 1).map((c) => c.id_apartamento);
      const disponibles = resAptos.data.filter((a) => !contratosActivos.includes(a.id));
      setApartamentos(disponibles);
    } catch (e) {
      console.log('Error al cargar apartamentos:', e.message);
      Alert.alert('Error', 'No se pudieron cargar los apartamentos o contratos.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const validarCampos = () => {
    const requeridos = Object.entries(form).filter(([k]) => k !== 'otros_detalles');
    for (let [key, val] of requeridos) {
      if (val === '' || val === null) return false;
    }
    return selectedApto !== null;
  };

  const guardarContrato = async () => {
    if (!validarCampos()) {
      Alert.alert('Campos requeridos', 'Debe completar todos los campos y seleccionar un apartamento.');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const payload = {
        id_apartamento: selectedApto.id,
        fecha_formalizacion: form.fecha_formalizacion,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        monto_mensual_inicial: parseFloat(form.monto_mensual_inicial),
        monto_deposito_inicial: parseFloat(form.monto_deposito_inicial),
        recibos_incluidos: form.recibos_incluidos,
        incluye_cable: form.incluye_cable,
        incluye_internet: form.incluye_internet,
        incluye_parqueo: form.incluye_parqueo,
        cantidad_personas: parseInt(form.cantidad_personas),
        cantidad_mascotas: parseInt(form.cantidad_mascotas),
        dia_pago_mes: Math.min(parseInt(form.dia_pago_mes), 31),
        fecha_maxima_pago_deposito: form.fecha_maxima_pago_deposito,
        dia_pago_agua: Math.min(parseInt(form.dia_pago_agua), 31),
        dia_pago_luz: Math.min(parseInt(form.dia_pago_luz), 31),
        estado: parseInt(form.estado),
        otros_detalles: form.otros_detalles.trim(),
      };

      const res = await axios.post(`${CONFIG.API_URL}/contratos/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const nuevoContrato = res.data;
      Alert.alert('Éxito', 'Contrato registrado correctamente.');

      // Navegación hacia InquilinoCrear
      navigation.navigate('InquilinoCrear', {
        id_contrato: nuevoContrato.id,
        cantidad_personas: parseInt(nuevoContrato.cantidad_personas),
      });
    } catch (e) {
      console.log('Error al guardar contrato:', e.response?.data || e.message);
      Alert.alert('Error', 'No se pudo guardar el contrato.');
    } finally {
      setSaving(false);
    }
  };

  const showDateModal = (field) => {
    setCurrentDateField(field);
    setTempDate(form[field]);
    setDateModalVisible(true);
  };

  const handleConfirmDate = () => {
    if (tempDate) handleChange(currentDateField, tempDate);
    setDateModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#3b82f6" size="large" />
        <Text style={styles.loadingText}>Cargando apartamentos...</Text>
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
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.header}>Nuevo Contrato</Text>

        {/* Selector apartamento */}
        <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
          <Text style={styles.label}>Apartamento:</Text>
          <Text style={styles.selectorText}>
            {selectedApto ? selectedApto.nombre : 'Seleccione un apartamento disponible'}
          </Text>
        </TouchableOpacity>

        {/* Fechas */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Inicio</Text>
            <TouchableOpacity onPress={() => showDateModal('fecha_inicio')}>
              <Text style={styles.dateField}>{form.fecha_inicio}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Fin</Text>
            <TouchableOpacity onPress={() => showDateModal('fecha_fin')}>
              <Text style={styles.dateField}>{form.fecha_fin}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Formalización</Text>
            <TouchableOpacity onPress={() => showDateModal('fecha_formalizacion')}>
              <Text style={styles.dateField}>{form.fecha_formalizacion}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Límite depósito</Text>
            <TouchableOpacity onPress={() => showDateModal('fecha_maxima_pago_deposito')}>
              <Text style={styles.dateField}>{form.fecha_maxima_pago_deposito}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Montos */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Monto mensual</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.monto_mensual_inicial}
              onChangeText={(t) => handleChange('monto_mensual_inicial', t.replace(/[^0-9.]/g, '') || '0')}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Depósito inicial</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.monto_deposito_inicial}
              onChangeText={(t) => handleChange('monto_deposito_inicial', t.replace(/[^0-9.]/g, '') || '0')}
            />
          </View>
        </View>

        {/* Campos numéricos en dos columnas */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Personas</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.cantidad_personas}
              onChangeText={(t) => handleChange('cantidad_personas', t.replace(/[^0-9]/g, '') || '0')}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Mascotas</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.cantidad_mascotas}
              onChangeText={(t) => handleChange('cantidad_mascotas', t.replace(/[^0-9]/g, '') || '0')}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Día pago mes</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              maxLength={2}
              value={form.dia_pago_mes}
              onChangeText={(t) => {
                const val = Math.min(parseInt(t || '0'), 31).toString();
                handleChange('dia_pago_mes', val);
              }}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Día pago agua</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              maxLength={2}
              value={form.dia_pago_agua}
              onChangeText={(t) => {
                const val = Math.min(parseInt(t || '0'), 31).toString();
                handleChange('dia_pago_agua', val);
              }}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Día pago luz</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              maxLength={2}
              value={form.dia_pago_luz}
              onChangeText={(t) => {
                const val = Math.min(parseInt(t || '0'), 31).toString();
                handleChange('dia_pago_luz', val);
              }}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Estado (1=activo)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.estado.toString()}
              onChangeText={(t) => handleChange('estado', t.replace(/[^0-9]/g, '') || '0')}
            />
          </View>
        </View>

        {/* Switches */}
        {[
          ['Recibos incluidos', 'recibos_incluidos'],
          ['Incluye cable', 'incluye_cable'],
          ['Incluye internet', 'incluye_internet'],
          ['Incluye parqueo', 'incluye_parqueo'],
        ].map(([label, key]) => (
          <View style={styles.switchRow} key={key}>
            <Text style={styles.label}>{label}</Text>
            <Switch value={form[key]} onValueChange={(v) => handleChange(key, v)} />
          </View>
        ))}

        {/* Detalles */}
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Otros detalles</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            value={form.otros_detalles}
            onChangeText={(t) => handleChange('otros_detalles', t)}
          />
        </View>

        {/* Botones */}
        <TouchableOpacity
          style={[styles.btn, saving ? styles.btnDisabled : styles.btnPrimary]}
          onPress={guardarContrato}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar contrato</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Cancelar y volver</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal apartamento */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Seleccione un apartamento</Text>
            <FlatList
              data={apartamentos}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedApto(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.nombre}</Text>
                  <Text style={styles.modalItemSub}>{item.direccion_fisica}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setModalVisible(false)}>
              <Text style={styles.btnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal fechas */}
      <Modal visible={dateModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Seleccione fecha</Text>
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
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleConfirmDate}>
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
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.8)' },
  container: { flex: 1, padding: 20 },
  header: { color: '#fff', fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
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
    marginBottom: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  col: { flex: 1 },
  selector: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  selectorText: { color: '#e2e8f0', fontSize: 16 },
  dateField: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 10,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldBlock: { marginBottom: 15 },
  btn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginVertical: 8 },
  btnPrimary: { backgroundColor: '#3b82f6' },
  btnSecondary: { backgroundColor: '#64748b' },
  btnDisabled: { backgroundColor: '#475569' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 14,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  modalItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalItemText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  modalItemSub: { color: '#cbd5e1', fontSize: 14 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 16 },
});
