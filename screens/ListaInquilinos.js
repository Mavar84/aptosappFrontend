import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  ImageBackground,
  Animated,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import CONFIG from './config';
export default function ListaInquilinos({ navigation }) {
  const [inquilinos, setInquilinos] = useState([]);
  const [contratosPorInquilino, setContratosPorInquilino] = useState({});
  const [fotosPorInquilino, setFotosPorInquilino] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingContratos, setLoadingContratos] = useState({});
  const [loadingFotos, setLoadingFotos] = useState({});
  const [modalMsg, setModalMsg] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [cedulaEliminar, setCedulaEliminar] = useState(null);
  const [animScale] = useState(new Animated.Value(0.8));
  const [animOpacity] = useState(new Animated.Value(0));
  const [eliminando, setEliminando] = useState(false);
  const [fotoGrandeVisible, setFotoGrandeVisible] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);
  const [cedulaFotoActual, setCedulaFotoActual] = useState(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [msgCargaFoto, setMsgCargaFoto] = useState('');
  const [modalTipo, setModalTipo] = useState('info');
  const [modalAnim] = useState(new Animated.Value(0));

  const showModal = (msg, tipo = 'info') => {
    setModalMsg(msg);
    setModalTipo(tipo);
    setModalVisible(true);
    modalAnim.setValue(0);
    Animated.spring(modalAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  };

  const cerrarModal = () => setModalVisible(false);

  useEffect(() => {
    cargarInquilinos();
  }, []);

  const cargarInquilinos = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${CONFIG.API_URL}/inquilinos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInquilinos(response.data);
      response.data.forEach((inq) => cargarFotosInquilino(inq.cedula));
    } catch {
      showModal('Error al cargar inquilinos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarContratos = async (cedula) => {
    try {
      setLoadingContratos((prev) => ({ ...prev, [cedula]: true }));
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${CONFIG.API_URL}/contratos/inquilino/${cedula}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContratosPorInquilino((prev) => ({ ...prev, [cedula]: res.data }));
    } catch {
      showModal('No se pudieron cargar los contratos de este inquilino.', 'error');
    } finally {
      setLoadingContratos((prev) => ({ ...prev, [cedula]: false }));
    }
  };

  const cargarFotosInquilino = async (cedula) => {
    try {
      setLoadingFotos((prev) => ({ ...prev, [cedula]: true }));
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${CONFIG.API_URL}/fotos/inquilino/${cedula}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFotosPorInquilino((prev) => ({ ...prev, [cedula]: res.data }));
    } catch {
      showModal('Error al cargar las fotos del inquilino.', 'error');
    } finally {
      setLoadingFotos((prev) => ({ ...prev, [cedula]: false }));
    }
  };

  const agregarFotoInquilino = async (cedula) => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        showModal('Permiso denegado para acceder a la galería.', 'error');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (resultado.canceled) return;

      const imagenBase64 = resultado.assets[0].base64;
      const token = await AsyncStorage.getItem('token');
      setMsgCargaFoto('Agregando foto...');
      setCargandoFoto(true);

      await axios.post(
        `${CONFIG.API_URL}/fotos/inquilino/${cedula}`,
        { base64_parte1: 'data:image/jpeg;base64,' + imagenBase64 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCargandoFoto(false);
      showModal('Foto agregada correctamente.', 'ok');
      cargarFotosInquilino(cedula);
    } catch {
      setCargandoFoto(false);
      showModal('Error al agregar la foto.', 'error');
    }
  };

  const eliminarFotoInquilino = async (cedula, id_foto) => {
    try {
      const token = await AsyncStorage.getItem('token');
      setMsgCargaFoto('Eliminando foto...');
      setCargandoFoto(true);
      await axios.delete(`${CONFIG.API_URL}/fotos/inquilino/${cedula}/${id_foto}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCargandoFoto(false);
      showModal('Foto eliminada correctamente.', 'ok');
      setFotoGrandeVisible(false);
      cargarFotosInquilino(cedula);
    } catch {
      setCargandoFoto(false);
      showModal('Error al eliminar la foto.', 'error');
    }
  };

  const confirmarEliminar = (cedula) => {
    setCedulaEliminar(cedula);
    setConfirmVisible(true);
    animScale.setValue(0.8);
    animOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(animScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(animOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const eliminarInquilino = async () => {
    setEliminando(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`${CONFIG.API_URL}/inquilinos/${cedulaEliminar}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimeout(() => {
        setEliminando(false);
        setConfirmVisible(false);
        showModal('Inquilino eliminado correctamente.', 'ok');
        cargarInquilinos();
      }, 1000);
    } catch {
      setEliminando(false);
      setConfirmVisible(false);
      showModal('Error al eliminar el inquilino.', 'error');
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.headerFixed}>
        <Text style={styles.header}>Lista de Inquilinos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          inquilinos.map((inq) => (
            <View key={inq.cedula} style={styles.card}>
              <Text style={styles.nombre}>🏠 {inq.nombre} {inq.p_apellido} {inq.s_apellido}</Text>
              <Text style={styles.texto}>🪪 Cédula: {inq.cedula}</Text>
              <Text style={styles.texto}>📧 {inq.correo || 'Correo no registrado'}</Text>
              <Text style={styles.texto}>📱 {inq.celular || 'Teléfono no disponible'}</Text>
              <Text style={styles.texto}>💼 {inq.profesion || 'Profesión no indicada'}</Text>

              <View style={{ marginTop: 10 }}>
                <Text style={[styles.texto, { fontWeight: 'bold' }]}>📷 Fotos:</Text>
                {loadingFotos[inq.cedula] ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : fotosPorInquilino[inq.cedula]?.length > 0 ? (
                  <View style={styles.fotosRow}>
                    {fotosPorInquilino[inq.cedula].map((foto) => (
                      <TouchableOpacity
                        key={foto.id}
                        onPress={() => {
                          setFotoSeleccionada(foto);
                          setCedulaFotoActual(inq.cedula);
                          setFotoGrandeVisible(true);
                        }}
                      >
                        <Image source={{ uri: foto.base64_parte1 }} style={styles.fotoMini} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.textoSecundario}>No hay fotos asociadas.</Text>
                )}

                <TouchableOpacity
                  style={[styles.btnMini, { backgroundColor: '#16a34a', marginTop: 10 }]}
                  onPress={() => agregarFotoInquilino(inq.cedula)}
                >
                  <Text style={styles.btnMiniText}>📸 Agregar Foto</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.btn}
                activeOpacity={0.8}
                onPress={() =>
                  contratosPorInquilino[inq.cedula]
                    ? setContratosPorInquilino((prev) => {
                        const copia = { ...prev };
                        delete copia[inq.cedula];
                        return copia;
                      })
                    : cargarContratos(inq.cedula)
                }
              >
                <Text style={styles.btnText}>
                  {contratosPorInquilino[inq.cedula] ? 'Ocultar Contratos' : 'Ver Contratos'}
                </Text>
              </TouchableOpacity>

              {loadingContratos[inq.cedula] && (
                <ActivityIndicator size="small" color="#333" style={{ marginTop: 10 }} />
              )}

              {contratosPorInquilino[inq.cedula] && (
                <View style={styles.contratosContainer}>
                  {contratosPorInquilino[inq.cedula].length === 0 ? (
                    <Text style={styles.textoSecundario}>No tiene contratos asociados.</Text>
                  ) : (
                    contratosPorInquilino[inq.cedula].map((ctr) => (
                      <View key={ctr.id} style={[styles.contratoCard, ctr.estado === 'Activo' && styles.contratoActivo]}>
                        <View style={styles.contratoHeader}>
                          <Text style={styles.textoContrato}>Contrato #{ctr.id}</Text>
                        </View>
                        <Text style={styles.textoSecundario}>
                          Fecha: {new Date(ctr.fecha_formalizacion).toLocaleDateString()}
                        </Text>
                        <TouchableOpacity
                          style={styles.btnMini}
                          onPress={() => navigation.navigate('DetalleContrato', { id_contrato: ctr.id })}
                        >
                          <Text style={styles.btnMiniText}>Ver Detalle</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[styles.btnSecundario, { marginTop: 10 }]}
                onPress={() => navigation.navigate('EditarInquilino', { cedula: inq.cedula })}
              >
                <Text style={styles.btnText}>✏️ Editar Inquilino</Text>
              </TouchableOpacity>

              {(!contratosPorInquilino[inq.cedula] ||
                contratosPorInquilino[inq.cedula].length === 0) && (
                <TouchableOpacity
                  style={[styles.btnEliminar, { marginTop: 10 }]}
                  onPress={() => confirmarEliminar(inq.cedula)}
                >
                  <Text style={styles.btnText}>🗑️ Eliminar Inquilino</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.btnFooter}
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.footerText}>⬅️ Volver al menú</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL FOTO GRANDE */}
      <Modal visible={fotoGrandeVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          {fotoSeleccionada && (
            <View style={styles.modalBox}>
              <Image
                source={{ uri: fotoSeleccionada.base64_parte1 }}
                style={{ width: 250, height: 250, borderRadius: 15, marginBottom: 15 }}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#dc2626', marginBottom: 10 }]}
                onPress={() => eliminarFotoInquilino(cedulaFotoActual, fotoSeleccionada.id)}
              >
                <Text style={styles.modalBtnText}>🗑️ Eliminar Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#475569' }]}
                onPress={() => setFotoGrandeVisible(false)}
              >
                <Text style={styles.modalBtnText}>❌ Cerrar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* MODAL DE CONFIRMAR ELIMINAR INQUILINO */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalBox,
              { transform: [{ scale: animScale }], opacity: animOpacity },
            ]}
          >
            {eliminando ? (
              <>
                <Image
                  source={{ uri: 'https://i.gifer.com/ZZ5H.gif' }}
                  style={{ width: 70, height: 70, marginBottom: 15 }}
                />
                <Text style={styles.modalText}>Eliminando inquilino...</Text>
              </>
            ) : (
              <>
                <Text style={styles.modalText}>
                  ¿Está seguro de eliminar este inquilino?
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: '#dc2626', marginRight: 10 }]}
                    onPress={eliminarInquilino}
                  >
                    <Text style={styles.modalBtnText}>Eliminar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: '#64748b' }]}
                    onPress={() => setConfirmVisible(false)}
                  >
                    <Text style={styles.modalBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* MODAL GENERAL DE MENSAJES */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalBox, { transform: [{ scale: modalAnim }] }]}>
            {modalTipo === 'ok' && (
              <Text style={{ fontSize: 40, color: '#16a34a', marginBottom: 10 }}>✔️</Text>
            )}
            {modalTipo === 'error' && (
              <Text style={{ fontSize: 40, color: '#dc2626', marginBottom: 10 }}>❌</Text>
            )}
            <Text style={styles.modalText}>{modalMsg}</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={cerrarModal}>
              <Text style={styles.modalBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* MODAL DE CARGA FOTO */}
      <Modal visible={cargandoFoto} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Image
              source={{ uri: 'https://i.gifer.com/ZZ5H.gif' }}
              style={{ width: 60, height: 60, marginBottom: 15 }}
            />
            <Text style={styles.modalText}>{msgCargaFoto}</Text>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.85)' },
  scrollContent: { padding: 20, paddingBottom: 120 },
  headerFixed: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: 'rgba(15,23,42,0.95)',
    zIndex: 10,
    paddingVertical: 15,
  },
  header: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 15,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  nombre: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  texto: { color: '#1e293b', fontSize: 15, marginVertical: 1 },
  textoSecundario: { color: '#475569', fontSize: 14, textAlign: 'center', marginTop: 5 },
  btn: { backgroundColor: '#1e40af', paddingVertical: 8, borderRadius: 10, marginTop: 10 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  btnSecundario: { backgroundColor: '#64748b', paddingVertical: 10, borderRadius: 10 },
  btnEliminar: { backgroundColor: '#dc2626', paddingVertical: 10, borderRadius: 10 },
  btnMini: { backgroundColor: '#334155', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start' },
  btnMiniText: { color: '#fff', fontSize: 13 },
  fotosRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5, gap: 8 },
  fotoMini: { width: 70, height: 70, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15,23,42,0.95)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnFooter: { backgroundColor: '#64748b', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 10 },
  footerText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', padding: 25, borderRadius: 15, width: '80%', alignItems: 'center' },
  modalText: { fontSize: 16, color: '#1e293b', textAlign: 'center', marginBottom: 10 },
  modalBtn: { backgroundColor: '#2563eb', paddingHorizontal: 25, paddingVertical: 8, borderRadius: 10 },
  modalBtnText: { color: '#fff', fontWeight: 'bold' },
});
