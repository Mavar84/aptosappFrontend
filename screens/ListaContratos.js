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
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import CONFIG from './config';
export default function ListaContratos({ navigation }) {
  const [contratos, setContratos] = useState([]);
  const [inquilinosPorContrato, setInquilinosPorContrato] = useState({});
  const [fotosPorContrato, setFotosPorContrato] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingFotos, setLoadingFotos] = useState({});
  const [modalMsg, setModalMsg] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmData, setConfirmData] = useState({ idContrato: null, cedula: '', nombre: '' });
  const [loadingInquilinos, setLoadingInquilinos] = useState({});
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  // NUEVOS ESTADOS PARA MODAL DE INQUILINOS
  const [modalInquilinosVisible, setModalInquilinosVisible] = useState(false);
  const [inquilinosBD, setInquilinosBD] = useState([]);
  const [loadingInquilinosBD, setLoadingInquilinosBD] = useState(false);
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null);

  // NUEVOS ESTADOS PARA ELIMINAR FOTO
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);
  const [eliminandoFoto, setEliminandoFoto] = useState(false);

  // NUEVOS ESTADOS PARA ELIMINAR CONTRATO
  const [confirmEliminarContratoVisible, setConfirmEliminarContratoVisible] = useState(false);
  const [contratoAEliminar, setContratoAEliminar] = useState(null);
  const [eliminandoContrato, setEliminandoContrato] = useState(false);

  const showModal = (msg) => {
    setModalMsg(msg);
    setModalVisible(true);
  };

  const cargarContratos = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const resp = await axios.get(`${CONFIG.API_URL}/contratos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContratos(resp.data);
    } catch (e) {
      console.log('Error al cargar contratos:', e.response?.data || e.message);
      showModal('❌ Error al cargar los contratos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarContratos();
  }, []);

  const cargarInquilinos = async (idContrato) => {
    try {
      setLoadingInquilinos((prev) => ({ ...prev, [idContrato]: true }));
      const token = await AsyncStorage.getItem('token');
      const relResp = await axios.get(`${CONFIG.API_URL}/contratos/${idContrato}/inquilinos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const relaciones = Array.isArray(relResp.data) ? relResp.data : [];
      const detalles = [];

      for (const rel of relaciones) {
        const inqResp = await axios.get(`${CONFIG.API_URL}/inquilinos/${rel.cedula_inquilino}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        detalles.push(inqResp.data);
      }

      setInquilinosPorContrato((prev) => ({ ...prev, [idContrato]: detalles }));
    } catch (e) {
      console.log('Error al cargar inquilinos:', e.response?.data || e.message);
      showModal('❌ Error al obtener los inquilinos del contrato.');
    } finally {
      setLoadingInquilinos((prev) => ({ ...prev, [idContrato]: false }));
    }
  };

  const cargarFotosContrato = async (idContrato) => {
    try {
      setLoadingFotos((prev) => ({ ...prev, [idContrato]: true }));
      const token = await AsyncStorage.getItem('token');
      const resp = await axios.get(`${CONFIG.API_URL}/fotos/contrato/${idContrato}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fotos = Array.isArray(resp.data) ? resp.data : [];
      setFotosPorContrato((prev) => ({ ...prev, [idContrato]: fotos }));
    } catch (e) {
      console.log('Error al cargar fotos:', e.response?.data || e.message);
      showModal('❌ Error al obtener las fotos del contrato.');
    } finally {
      setLoadingFotos((prev) => ({ ...prev, [idContrato]: false }));
    }
  };

  const eliminarFotoContrato = async (idContrato, idFoto) => {
    try {
      setEliminandoFoto(true);
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`${CONFIG.API_URL}/fotos/contrato/${idContrato}/${idFoto}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showModal('🗑️ Foto eliminada correctamente.');
      setImagenAmpliada(null);
      setFotoSeleccionada(null);
      cargarFotosContrato(idContrato);
    } catch (e) {
      console.log('Error al eliminar foto:', e.response?.data || e.message);
      showModal('❌ No se pudo eliminar la foto.');
    } finally {
      setEliminandoFoto(false);
    }
  };

  const eliminarContrato = async (idContrato) => {
    try {
      setEliminandoContrato(true);
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`${CONFIG.API_URL}/contratos/${idContrato}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showModal('🗑️ Contrato eliminado correctamente.');
      setConfirmEliminarContratoVisible(false);
      cargarContratos();
    } catch (e) {
      console.log('Error al eliminar contrato:', e.response?.data || e.message);
      showModal('❌ No se pudo eliminar el contrato.');
    } finally {
      setEliminandoContrato(false);
    }
  };

  const abrirConfirmarEliminarContrato = (contrato) => {
    setContratoAEliminar(contrato);
    setConfirmEliminarContratoVisible(true);
  };

  const eliminarInquilinoDelContrato = async (idContrato, cedula) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`${CONFIG.API_URL}/contratos/${idContrato}/inquilino/${cedula}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showModal(`🗑️ Inquilino ${cedula} eliminado del contrato.`);
      cargarInquilinos(idContrato);
    } catch (e) {
      console.log('Error al eliminar inquilino del contrato:', e.response?.data || e.message);
      showModal('❌ No se pudo eliminar el inquilino del contrato.');
    }
  };

  const abrirConfirmacion = (idContrato, cedula, nombre) => {
    setConfirmData({ idContrato, cedula, nombre });
    setConfirmVisible(true);
  };

  const confirmarEliminacion = () => {
    const { idContrato, cedula } = confirmData;
    setConfirmVisible(false);
    eliminarInquilinoDelContrato(idContrato, cedula);
  };

  const abrirImagen = (base64_parte1, base64_parte2, idContrato, idFoto) => {
    const base64Completo = (base64_parte1 || '') + (base64_parte2 || '');
    setImagenAmpliada(base64Completo);
    setFotoSeleccionada({ idContrato, idFoto });
  };

  const cargarInquilinosBD = async () => {
    try {
      setLoadingInquilinosBD(true);
      const token = await AsyncStorage.getItem('token');
      const resp = await axios.get(`${CONFIG.API_URL}inquilinos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInquilinosBD(resp.data || []);
    } catch (e) {
      console.log('Error al listar inquilinos:', e.response?.data || e.message);
      showModal('❌ Error al listar los inquilinos.');
    } finally {
      setLoadingInquilinosBD(false);
    }
  };

  const abrirModalInquilinos = (idContrato) => {
    setContratoSeleccionado(idContrato);
    setModalInquilinosVisible(true);
    cargarInquilinosBD();
  };

  const agregarInquilinoAContrato = async (cedula) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${CONFIG.API_URL}/contratos/inquilinos`,
        {
          id_contrato: contratoSeleccionado,
          cedula_inquilino: cedula,
          prioridad: 1,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showModal('✅ Inquilino agregado correctamente al contrato.');
      setModalInquilinosVisible(false);
      cargarInquilinos(contratoSeleccionado);
    } catch (e) {
      console.log('Error al agregar inquilino:', e.response?.data || e.message);
      showModal('❌ No se pudo agregar el inquilino.');
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1600585154154-43c9cd0620a4?auto=format&fit=crop&w=1400&q=80',
      }}
      style={styles.background}
    >
      <View style={styles.overlay} />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.header}>Listado de Contratos</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.botonNuevoContrato}
          onPress={() => navigation.navigate('NuevoContrato')}
        >
          <Text style={styles.textoBotonNuevoContrato}>➕ Nuevo Contrato</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
        ) : contratos.length === 0 ? (
          <Text style={styles.noData}>No hay contratos registrados.</Text>
        ) : (
          contratos.map((c) => (
            <View key={c.id} style={styles.card}>
              <Text style={styles.title}>Contrato #{c.id}</Text>
              <Text style={styles.item}>Apartamento: {c.id_apartamento || '—'}</Text>
              <Text style={styles.item}>Inicio: {c.fecha_inicio?.split('T')[0] || '—'}</Text>
              <Text style={styles.item}>Fin: {c.fecha_fin?.split('T')[0] || '—'}</Text>
              <Text style={styles.item}>Monto mensual: ₡{c.monto_mensual_inicial}</Text>
              <Text style={styles.item}>Depósito: ₡{c.monto_deposito_inicial}</Text>
              <Text style={styles.item}>Personas: {c.cantidad_personas}</Text>
              <Text style={styles.item}>Mascotas: {c.cantidad_mascotas}</Text>
              <Text style={styles.item}>
                Estado: {c.estado === 1 ? 'Activo 🟢' : 'Inactivo 🔴'}
              </Text>

              <View style={styles.actionGroup}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionButton, { backgroundColor: '#38bdf8' }]}
                  onPress={() => cargarInquilinos(c.id)}
                >
                  <Text style={styles.actionText}>👥 Inquilinos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
                  onPress={() => abrirModalInquilinos(c.id)}
                >
                  <Text style={styles.actionText}>➕ Agregar</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionGroup}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionButton, { backgroundColor: '#facc15' }]}
                  onPress={() => cargarFotosContrato(c.id)}
                >
                  <Text style={styles.actionText}>🖼️ Fotos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
                  onPress={() => navigation.navigate('ContratoDetalle', { id_contrato: c.id })}
                >
                  <Text style={styles.actionText}>🧾 Detalle</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionGroup}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionButton, { backgroundColor: '#a855f7' }]}
                  onPress={() => navigation.navigate('EditarContrato', { id_contrato: c.id })}
                >
                  <Text style={styles.actionText}>✏️ Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                  onPress={() => abrirConfirmarEliminarContrato(c)}
                >
                  <Text style={styles.actionText}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              </View>

              {loadingFotos[c.id] && <ActivityIndicator color="#fff" style={{ marginVertical: 6 }} />}
              {fotosPorContrato[c.id] && fotosPorContrato[c.id].length > 0 && (
                <View style={styles.fotoContainer}>
                  {fotosPorContrato[c.id].map((foto) => {
                    const base64Completo = (foto.base64_parte1 || '') + (foto.base64_parte2 || '');
                    return (
                      <TouchableOpacity
                        key={foto.id}
                        onPress={() => abrirImagen(foto.base64_parte1, foto.base64_parte2, c.id, foto.id)}
                      >
                        <Image source={{ uri: `${base64Completo}` }} style={styles.fotoMiniatura} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {loadingInquilinos[c.id] ? (
                <ActivityIndicator color="#fff" style={{ marginVertical: 6 }} />
              ) : inquilinosPorContrato[c.id]?.length > 0 ? (
                inquilinosPorContrato[c.id].map((inq) => (
                  <View key={inq.cedula} style={styles.inquilinoCard}>
                    <View style={styles.inquilinoRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inquilinoName}>
                          {inq.nombre} {inq.p_apellido} {inq.s_apellido || ''}
                        </Text>
                        <Text style={styles.inquilinoDetail}>Cédula: {inq.cedula}</Text>
                        <Text style={styles.inquilinoDetail}>Celular: {inq.celular || '—'}</Text>
                        <Text style={styles.inquilinoDetail}>Correo: {inq.correo || '—'}</Text>
                        <Text style={styles.inquilinoDetail}>Profesión: {inq.profesion || '—'}</Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.deleteBtn]}
                        onPress={() => abrirConfirmacion(c.id, inq.cedula, `${inq.nombre} ${inq.p_apellido}`)}
                      >
                        <Text style={{ color: '#fff', fontSize: 15 }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noInquilinos}>Sin inquilinos cargados — presione “Inquilinos”.</Text>
              )}
            </View>
          ))
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.botonVolverMenu}
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.textoBotonVolverMenu}>⬅️ Volver al menú</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL IMAGEN AMPLIADA */}
      <Modal visible={!!imagenAmpliada} transparent animationType="fade">
        <View style={styles.modalContainer}>
          {imagenAmpliada && (
            <View style={{ position: 'relative', alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setImagenAmpliada(null);
                  setFotoSeleccionada(null);
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              {eliminandoFoto ? (
                <ActivityIndicator size="large" color="#fff" style={{ marginTop: 15 }} />
              ) : (
                <TouchableOpacity
                  style={styles.deleteFotoBtn}
                  onPress={() =>
                    eliminarFotoContrato(fotoSeleccionada.idContrato, fotoSeleccionada.idFoto)
                  }
                >
                  <Text style={styles.deleteFotoText}>🗑️ Eliminar foto</Text>
                </TouchableOpacity>
              )}

              <Image
                source={{ uri: imagenAmpliada }}
                style={styles.imagenGrande}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </Modal>

      {/* MODAL CONFIRMAR ELIMINAR CONTRATO */}
      <Modal visible={confirmEliminarContratoVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            {eliminandoContrato ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <Text style={styles.modalTitle}>
                  ¿Eliminar contrato #{contratoAEliminar?.id}?
                </Text>
                <View style={styles.rowConfirm}>
                  <TouchableOpacity
                    style={[styles.btnSmall, styles.btnPrimary]}
                    onPress={() => eliminarContrato(contratoAEliminar.id)}
                  >
                    <Text style={styles.btnTextSmall}>Sí, eliminar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnSmall, styles.btnSecondary]}
                    onPress={() => setConfirmEliminarContratoVisible(false)}
                  >
                    <Text style={styles.btnTextSmall}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL MENSAJES GENERALES */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{modalMsg}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.btnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CONFIRMAR ELIMINAR INQUILINO DEL CONTRATO */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              ¿Eliminar a{' '}
              <Text style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                {confirmData.nombre || confirmData.cedula}
              </Text>
              ?
            </Text>
            <View style={styles.rowConfirm}>
              <TouchableOpacity
                style={[styles.btnSmall, styles.btnPrimary]}
                onPress={confirmarEliminacion}
              >
                <Text style={styles.btnTextSmall}>Sí, eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSmall, styles.btnSecondary]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.btnTextSmall}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* OPCIONAL: si desea, aquí podría ir un modal que liste inquilinosBD para agregar, 
          pero mantengo su estructura original sin añadir UI adicional */}
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.85)' },
  container: { flex: 1, padding: 20 },
  header: { color: '#fff', fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: { color: '#fff', fontSize: 19, fontWeight: '700', marginBottom: 6 },
  item: { color: '#cbd5e1', fontSize: 14, marginBottom: 3 },
  noData: { color: '#fff', textAlign: 'center', fontSize: 16, marginTop: 40 },

  actionGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 10 },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  inquilinoCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  inquilinoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deleteBtn: { backgroundColor: '#ef4444', padding: 8, borderRadius: 8, width: 42, alignItems: 'center' },
  inquilinoName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  inquilinoDetail: { color: '#cbd5e1', fontSize: 13 },
  noInquilinos: { color: '#94a3b8', marginTop: 6, fontStyle: 'italic' },

  fotoContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 },
  fotoMiniatura: { width: 85, height: 85, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  imagenGrande: { width: 350, height: 350, borderRadius: 12, marginTop: 10 },

  closeButton: {
    position: 'absolute',
    top: -40,
    right: -150,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 999,
  },
  closeButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#1e293b', padding: 25, borderRadius: 14, width: '85%', alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  rowConfirm: { flexDirection: 'row', gap: 10, marginTop: 10 },

  botonNuevoContrato: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    marginVertical: 15,
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  textoBotonNuevoContrato: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  botonVolverMenu: {
    backgroundColor: '#475569',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    width: '100%',
  },
  textoBotonVolverMenu: {
    color: '#f1f5f9',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  btn: { backgroundColor: '#3b82f6', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 10, marginTop: 10 },
  btnPrimary: { backgroundColor: '#3b82f6' },
  btnSecondary: { backgroundColor: '#64748b' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnSmall: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  btnTextSmall: { color: '#fff', fontSize: 14, fontWeight: '600' },

  deleteFotoBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  deleteFotoText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
