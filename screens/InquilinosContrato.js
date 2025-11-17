import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import CONFIG from './config';
export default function InquilinosContrato({ route, navigation }) {
  const { id_contrato, cantidad_personas } = route.params;

  const [inquilinos, setInquilinos] = useState(
    Array.from({ length: cantidad_personas }, () => ({
      cedula: '',
      nombre: '',
      p_apellido: '',
      s_apellido: '',
      nacionalidad: '',
      fecha_nac: new Date().toISOString().split('T')[0],
      celular: '',
      correo: '',
      genero: 0,
      profesion: '',
      fotoFrente: null,
      fotoReverso: null,
    }))
  );

  const [saving, setSaving] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [tempDate, setTempDate] = useState('');

  // Modal de mensajes
  const [modalMsg, setModalMsg] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const showModal = (msg) => {
    setModalMsg(msg);
    setModalVisible(true);
  };

  const handleChange = (index, campo, valor) => {
    const updated = [...inquilinos];
    updated[index][campo] = valor;
    setInquilinos(updated);
  };

  const seleccionarImagen = async (index, campo) => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      showModal('Debe otorgar permisos para acceder a la galería.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });

    if (!resultado.canceled) {
      const base64 = `data:image/jpeg;base64,${resultado.assets[0].base64}`;
      handleChange(index, campo, base64);
    }
  };

  const esCorreoValido = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

  const validar = () => {
    for (let i = 0; i < inquilinos.length; i++) {
      const p = inquilinos[i];
      if (
        !p.cedula ||
        !p.nombre ||
        !p.p_apellido ||
        !p.nacionalidad ||
        !p.celular ||
        !p.correo ||
        !p.fecha_nac
      ) {
        showModal(`Debe completar todos los campos del inquilino ${i + 1}.`);
        return false;
      }
      if (p.cedula.length < 6) {
        showModal(`La cédula del inquilino ${i + 1} debe tener al menos 6 dígitos.`);
        return false;
      }
      if (p.celular.length < 8) {
        showModal(`El celular del inquilino ${i + 1} debe tener al menos 8 dígitos.`);
        return false;
      }
      if (!esCorreoValido(p.correo)) {
        showModal(`El correo del inquilino ${i + 1} no tiene formato válido.`);
        return false;
      }
      if (!p.fotoFrente || !p.fotoReverso) {
        showModal(`Debe adjuntar ambas fotos de la cédula para el inquilino ${i + 1}.`);
        return false;
      }
    }
    return true;
  };

  const guardarInquilinos = async () => {
    if (!validar()) return;

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');

      for (let i = 0; i < inquilinos.length; i++) {
        const inq = inquilinos[i];

        // 1️⃣ Guardar inquilino
        await axios.post(`${CONFIG.API_URL}/inquilinos/`, inq, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 2️⃣ Guardar foto asociada
        const fotoPayload = {
          contexto: 'Cédula de inquilino',
          base64_parte1: inq.fotoFrente,
          base64_parte2: inq.fotoReverso,
        };

        await axios.post(`${CONFIG.API_URL}/fotos/inquilino/${inq.cedula}`, fotoPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 3️⃣ Guardar relación contrato-inquilino
        const relacion = {
          id_contrato,
          cedula_inquilino: inq.cedula,
          prioridad: i + 1,
        };

        await axios.post(`${CONFIG.API_URL}/contratos/inquilinos`, relacion, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      showModal('✅ Inquilinos, fotos y relaciones registradas correctamente.');
    } catch (e) {
      console.log('Error al guardar inquilinos:', e.response?.data || e.message);
      showModal('❌ Error al guardar los inquilinos o las fotos.');
    } finally {
      setSaving(false);
    }
  };

  const openDateModal = (index) => {
    setCurrentIndex(index);
    setTempDate(inquilinos[index].fecha_nac);
    setDateModalVisible(true);
  };

  const confirmDate = () => {
    if (currentIndex !== null && tempDate) {
      handleChange(currentIndex, 'fecha_nac', tempDate);
    }
    setDateModalVisible(false);
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1600585154154-43c9cd0620a4?auto=format&fit=crop&w=1200&q=80',
      }}
      style={styles.background}
    >
      <View style={styles.overlay} />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.header}>Registrar Inquilinos</Text>
        <Text style={styles.subHeader}>
          Contrato #{id_contrato} — {cantidad_personas} persona{cantidad_personas > 1 ? 's' : ''}
        </Text>

        {inquilinos.map((inq, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.sectionHeader}>Inquilino {index + 1}</Text>

            <Text style={styles.label}>Cédula*</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={inq.cedula}
              onChangeText={(t) => handleChange(index, 'cedula', t.replace(/[^0-9]/g, ''))}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Nombre*</Text>
                <TextInput
                  style={styles.input}
                  value={inq.nombre}
                  onChangeText={(t) => handleChange(index, 'nombre', t)}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Primer apellido*</Text>
                <TextInput
                  style={styles.input}
                  value={inq.p_apellido}
                  onChangeText={(t) => handleChange(index, 'p_apellido', t)}
                />
              </View>
            </View>

            <Text style={styles.label}>Segundo apellido</Text>
            <TextInput
              style={styles.input}
              value={inq.s_apellido}
              onChangeText={(t) => handleChange(index, 's_apellido', t)}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Nacionalidad*</Text>
                <TextInput
                  style={styles.input}
                  value={inq.nacionalidad}
                  onChangeText={(t) => handleChange(index, 'nacionalidad', t)}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Género (0=M,1=F)*</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={inq.genero.toString()}
                  onChangeText={(t) => handleChange(index, 'genero', t.replace(/[^0-9]/g, '') || '0')}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Celular*</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={inq.celular}
                  onChangeText={(t) => handleChange(index, 'celular', t.replace(/[^0-9]/g, ''))}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Correo*</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="email-address"
                  value={inq.correo}
                  onChangeText={(t) => handleChange(index, 'correo', t)}
                />
              </View>
            </View>

            <TouchableOpacity onPress={() => openDateModal(index)}>
              <Text style={styles.label}>Fecha de nacimiento*</Text>
              <Text style={styles.dateField}>{inq.fecha_nac}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Profesión</Text>
            <TextInput
              style={styles.input}
              value={inq.profesion}
              onChangeText={(t) => handleChange(index, 'profesion', t)}
            />

            <Text style={styles.label}>Fotos de cédula*</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.btnSmall, styles.btnPrimary]}
                onPress={() => seleccionarImagen(index, 'fotoFrente')}
              >
                <Text style={styles.btnTextSmall}>Seleccionar frente</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSmall, styles.btnPrimary]}
                onPress={() => seleccionarImagen(index, 'fotoReverso')}
              >
                <Text style={styles.btnTextSmall}>Seleccionar reverso</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              {inq.fotoFrente && <Image source={{ uri: inq.fotoFrente }} style={styles.preview} />}
              {inq.fotoReverso && <Image source={{ uri: inq.fotoReverso }} style={styles.preview} />}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.btn, saving ? styles.btnDisabled : styles.btnPrimary]}
          onPress={guardarInquilinos}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar todos los inquilinos</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal fecha */}
      <Modal visible={dateModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Seleccione fecha de nacimiento</Text>
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

      {/* Modal mensajes */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{modalMsg}</Text>
            {modalMsg.includes('registradas correctamente') ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <TouchableOpacity
                  style={[styles.btnSmall, styles.btnPrimary, { flex: 1, marginRight: 8 }]}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('Menu');
                  }}
                >
                  <Text style={styles.btnTextSmall}>Volver al menú</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSmall, styles.btnSecondary, { flex: 1 }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.btnTextSmall}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnText}>Cerrar</Text>
              </TouchableOpacity>
            )}
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
  header: { color: '#fff', fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subHeader: { color: '#cbd5e1', fontSize: 16, textAlign: 'center', marginBottom: 15 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sectionHeader: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 10 },
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
  preview: { width: 80, height: 80, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#fff' },
  btn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginVertical: 8 },
  btnSmall: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, alignItems: 'center', flex: 1 },
  btnPrimary: { backgroundColor: '#3b82f6' },
  btnSecondary: { backgroundColor: '#64748b' },
  btnDisabled: { backgroundColor: '#475569' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnTextSmall: { color: '#fff', fontSize: 13, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    backgroundColor: '#1e293b',
    padding: 25,
    borderRadius: 14,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
});
