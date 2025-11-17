import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Modal,
  ActivityIndicator,
  Image,
  Pressable,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import CONFIG from './config';
export default function PagoDetalleScreen({ route, navigation }) {
  const { id } = route.params;
  const [pago, setPago] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState('');
  const [fotos, setFotos] = useState([]);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [confirmEliminarVisible, setConfirmEliminarVisible] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);
  const fadeAnimRefs = useRef({});

  const showModal = (msg) => {
    setModalMsg(msg);
    setModalVisible(true);
  };

  const obtenerPago = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${CONFIG.API_URL}pagos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPago(res.data);
    } catch {
      showModal('Error al cargar el pago.');
    } finally {
      setLoading(false);
    }
  };

  const listarFotosPago = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${CONFIG.API_URL}/fotos/pago/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const imagenes = res.data.map((f) => ({
        id: f.id,
        uri: `data:image/jpeg;base64,${(f.base64_parte1 || '') + (f.base64_parte2 || '')}`,
      }));
      setFotos(imagenes);
      fadeAnimRefs.current = Object.fromEntries(
        imagenes.map((f) => [f.id, new Animated.Value(1)])
      );
    } catch {
      showModal('Error al listar las fotos del pago.');
    }
  };

  useEffect(() => {
    obtenerPago();
    listarFotosPago();
  }, []);

  const actualizarMonto = (valor) => {
    if (!pago) return;
    const monto = parseFloat(valor) || 0;
    const adeudado = parseFloat(pago.monto_esperado) - monto;
    setPago({
      ...pago,
      monto_pagado: monto,
      monto_adeudado_de_este_pago: adeudado > 0 ? adeudado : 0,
      estado: adeudado <= 0 ? 2 : 1,
    });
  };

  const registrarPago = async () => {
    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('token');
      const datosActualizados = { ...pago, fecha_pago: new Date().toISOString() };
      const res = await axios.put(`${CONFIG.API_URL}/pagos/${id}`, datosActualizados, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showModal('Pago registrado correctamente.');
      setPago(res.data);
    } catch {
      showModal('Error al registrar el pago.');
    } finally {
      setSubmitting(false);
    }
  };

  const seleccionarFoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled) {
        setSubiendoFoto(true);
        const base64 = result.assets[0].base64;
        const mitad = Math.ceil(base64.length / 2);
        const parte1 = base64.substring(0, mitad);
        const parte2 = base64.substring(mitad);
        const token = await AsyncStorage.getItem('token');
        const foto = { base64_parte1: parte1, base64_parte2: parte2, contexto: 'pago' };
        await axios.post(`${CONFIG.API_URL}/fotos/pago/${id}`, foto, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showModal('Foto cargada correctamente.');
        await listarFotosPago();
      }
    } catch {
      showModal('Error al cargar la foto.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const confirmarEliminar = (foto) => {
    setFotoSeleccionada(foto);
    setConfirmEliminarVisible(true);
  };

  const eliminarFoto = async () => {
    if (!fotoSeleccionada) return;
    const fadeAnim = fadeAnimRefs.current[fotoSeleccionada.id];
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        await axios.delete(
          `${CONFIG.API_URL}/fotos/pago/${id}/${fotoSeleccionada.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showModal('Foto eliminada correctamente.');
        await listarFotosPago();
      } catch {
        showModal('Error al eliminar la foto.');
      } finally {
        setConfirmEliminarVisible(false);
        setFotoSeleccionada(null);
      }
    });
  };

  if (loading)
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff' }}>Cargando pago...</Text>
      </View>
    );

  return (
    <ImageBackground
      source={{
        uri: 'https://cdn.pixabay.com/photo/2017/09/07/08/56/money-2724235_1280.jpg',
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.headerFixed}>
        <Text style={styles.header}>Registrar Pago</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {pago && (
          <>
            <Text style={styles.label}>Detalle</Text>
            <TextInput style={styles.input} value={pago.detalle || ''} editable={false} />
            <Text style={styles.label}>Monto esperado</Text>
            <TextInput style={styles.input} value={String(pago.monto_esperado || '')} editable={false} />
            <Text style={styles.label}>Monto pagado</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#fff', color: '#000' }]}
              keyboardType="numeric"
              value={String(pago.monto_pagado || '')}
              onChangeText={actualizarMonto}
            />
            <Text style={styles.label}>Monto adeudado</Text>
            <TextInput
              style={styles.input}
              value={String(pago.monto_adeudado_de_este_pago || '')}
              editable={false}
            />
            <Text style={styles.label}>Estado</Text>
            <TextInput
              style={styles.input}
              value={pago.estado === 2 ? 'Pagado' : 'Pendiente'}
              editable={false}
            />

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { marginTop: 20 }]}
              onPress={registrarPago}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>💰 Registrar pago</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary, { marginTop: 15 }]}
              onPress={seleccionarFoto}
              disabled={subiendoFoto}
            >
              {subiendoFoto ? (
                <Image source={{ uri: 'https://i.gifer.com/ZZ5H.gif' }} style={{ width: 60, height: 60 }} />
              ) : (
                <Text style={styles.btnText}>📷 Agregar comprobante</Text>
              )}
            </TouchableOpacity>

            {fotos.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.label, { color: '#fff' }]}>Fotos del pago:</Text>
                <View style={styles.fotosContainer}>
                  {fotos.map((foto) => (
                    <Animated.View key={foto.id} style={{ opacity: fadeAnimRefs.current[foto.id] }}>
                      <View style={styles.fotoBox}>
                        <Pressable onPress={() => setFotoAmpliada(foto.uri)}>
                          <Image source={{ uri: foto.uri }} style={{ width: 120, height: 120, borderRadius: 10 }} />
                        </Pressable>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmarEliminar(foto)}>
                          <Text style={{ color: '#fff', fontWeight: 'bold' }}>✖</Text>
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footerFixed}>
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary, { width: '90%' }]}
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.btnText}>⬅️ Volver al menú</Text>
        </TouchableOpacity>
      </View>

      {/* Modales */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>{modalMsg}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBtn}>
              <Text style={{ color: '#fff' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmEliminarVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>¿Eliminar esta foto del pago?</Text>
            <TouchableOpacity onPress={eliminarFoto} style={styles.modalBtn}>
              <Text style={{ color: '#fff' }}>Sí, eliminar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setConfirmEliminarVisible(false)}
              style={[styles.modalBtn, { backgroundColor: '#64748B' }]}
            >
              <Text style={{ color: '#fff' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!fotoAmpliada} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <Image source={{ uri: fotoAmpliada }} style={{ width: '90%', height: '70%', borderRadius: 15 }} resizeMode="contain" />
          <TouchableOpacity onPress={() => setFotoAmpliada(null)} style={styles.modalBtn}>
            <Text style={{ color: '#fff' }}>❌ Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.85)' },
  container: { padding: 20, paddingTop: 100, paddingBottom: 100 },
  headerFixed: { position: 'absolute', top: 0, width: '100%', backgroundColor: 'rgba(15,23,42,0.95)', paddingVertical: 12, zIndex: 5 },
  footerFixed: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(15,23,42,0.95)', alignItems: 'center', paddingVertical: 12 },
  header: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  label: { color: '#fff', marginTop: 10, fontWeight: 'bold' },
  input: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: 10, color: '#fff' },
  btn: { padding: 12, borderRadius: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#2563EB' },
  btnSecondary: { backgroundColor: '#64748B' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  loaderContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#1e293b', padding: 25, borderRadius: 15, width: '80%', alignItems: 'center' },
  modalText: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 15 },
  modalBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 10, marginTop: 15 },
  fotosContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  fotoBox: { position: 'relative', margin: 5 },
  deleteBtn: { position: 'absolute', top: 3, right: 3, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 3 },
});
