import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import CONFIG from './config';

const { width, height } = Dimensions.get('window');

export default function ApartmentsListScreen({ navigation }) {
  const [apartamentos, setApartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [modalVisible, setModalVisible] = useState(false); // detalle apto
  const [modalImageVisible, setModalImageVisible] = useState(false); // ver imagen
  const [modalConfirmVisible, setModalConfirmVisible] = useState(false); // confirmar eliminar apto
  const [modalConfirmFotoVisible, setModalConfirmFotoVisible] = useState(false); // confirmar eliminar foto

  const [selectedApto, setSelectedApto] = useState(null); // apto mostrado en modal detalle
  const [aptoFotoActual, setAptoFotoActual] = useState(null); // { id_foto, uri, id_apto }

  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    cargarApartamentos();
  }, []);

  const construirDataUri = (f) => {
    const base64 = `${f.base64_parte1 || ''}${f.base64_parte2 || ''}`;
    return base64 ? `data:image/jpeg;base64,${base64}` : null;
  };

  // Carga base (datos) y hace lazy-load de fotos por apto
  const cargarApartamentos = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const resAptos = await axios.get(`${CONFIG.API_URL}/apartamentos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const aptosBase = resAptos.data.map((a) => ({ ...a, fotos: [], cargandoFotos: true }));
      setApartamentos(aptosBase);
      setLoading(false); // permite navegar mientras llegan fotos

      for (const apto of resAptos.data) {
        cargarFotosApto(apto.id, token);
        await new Promise((r) => setTimeout(r, 80)); // escalonado
      }
    } catch (e) {
      console.log('Error al cargar apartamentos:', e.response?.data || e.message);
      setLoading(false);
    }
  };

  const cargarFotosApto = async (id, token) => {
    try {
      const res = await axios.get(`${CONFIG.API_URL}/fotos/apartamento/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fotos = res.data
        .map((f) => ({ id_foto: f.id, uri: construirDataUri(f) }))
        .filter((x) => !!x.uri);
      setApartamentos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, fotos, cargandoFotos: false } : a))
      );
    } catch {
      setApartamentos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, fotos: [], cargandoFotos: false } : a))
      );
    }
  };

  const abrirDetalles = async (id) => {
    setLoadingDetails(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${CONFIG.API_URL}/apartamentos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedApto(res.data);
      setModalVisible(true);
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    } catch (e) {
      console.log('Error al cargar detalles:', e.response?.data || e.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const cerrarModal = () => {
    Animated.timing(scaleAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setModalVisible(false);
      setSelectedApto(null);
    });
  };

  const abrirImagen = (foto, apto) => {
    setAptoFotoActual({ ...foto, id_apto: apto.id }); // asegura id_apto presente
    setModalImageVisible(true);
  };

  const confirmarEliminarFoto = () => setModalConfirmFotoVisible(true);

  const eliminarFoto = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!aptoFotoActual?.id_apto || !aptoFotoActual?.id_foto) return; // guard
      await axios.delete(
        `${CONFIG.API_URL}/fotos/apartamento/${aptoFotoActual.id_apto}/${aptoFotoActual.id_foto}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalConfirmFotoVisible(false);
      setModalImageVisible(false);
      await cargarFotosApto(aptoFotoActual.id_apto, token); // refresca solo ese apto
      setAptoFotoActual(null);
    } catch (e) {
      console.log('Error al eliminar foto:', e.response?.data || e.message);
    }
  };

  const confirmarEliminarApartamento = () => setModalConfirmVisible(true);

  const eliminarApartamento = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!selectedApto?.id) return;
      await axios.delete(`${CONFIG.API_URL}/apartamentos/${selectedApto.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModalConfirmVisible(false);
      cerrarModal();
      cargarApartamentos();
    } catch (e) {
      console.log('Error al eliminar apartamento:', e.response?.data || e.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.cargandoFotos ? (
        <View style={styles.imagePlaceholder}>
          <ActivityIndicator color="#3b82f6" size="small" />
          <Text style={styles.placeholderText}>Cargando fotos...</Text>
        </View>
      ) : item.fotos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageCarousel}>
          {item.fotos.map((foto, idx) => (
            <TouchableOpacity key={`${item.id}-foto-${idx}`} onPress={() => abrirImagen(foto, item)}>
              <Image source={{ uri: foto.uri }} style={styles.imageCarouselItem} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>Sin fotos</Text>
        </View>
      )}

      <View style={styles.cardHeaderRow}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => abrirDetalles(item.id)}>
          <Text style={styles.cardTitle}>{item.nombre || 'Sin nombre'}</Text>
          <Text style={styles.cardSubtitle}>
            Piso {item.num_piso || '-'} | {item.num_cuartos || 0} hab. | {item.num_bannos || 0} baños
          </Text>
          <Text style={styles.cardAddress}>{item.direccion_fisica || 'Sin dirección'}</Text>
        </TouchableOpacity>

        {/* Botón agregar fotos -> navega a pantalla para subir fotos con id_apto */}
        <TouchableOpacity
          style={styles.btnAddPhoto}
          onPress={() => 
            
          
        navigation.navigate('AddApartmentPhotos', { id_apto: item.id })
        }
        >
          <Text style={styles.btnAddPhotoText}>📸</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={{
        // Imagen alusiva a apartamentos/condominios
        uri: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1200&q=80',
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.container}>
        <Text style={styles.header}>Listado de Apartamentos</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Cargando apartamentos...</Text>
          </View>
        ) : (
          <FlatList
            data={apartamentos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}

        {/* Botones inferiores (nuevo apto / menú) */}
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => navigation.navigate('Napartamento')}
          >
            <Text style={styles.btnText}>＋ Nuevo Apartamento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => navigation.navigate('Menu')}
          >
            <Text style={styles.btnText}>← Volver al menú</Text>
          </TouchableOpacity>
        </View>
      </View>

     {/* Modal detalles de apartamento */}
<Modal visible={modalVisible && !!selectedApto} transparent animationType="none">
  <View style={styles.modalContainer}>
    <Animated.View style={[styles.modalBox, { transform: [{ scale: scaleAnim }] }]}>
      {loadingDetails ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando detalles...</Text>
        </View>
      ) : (
        <ScrollView>
          <Text style={styles.modalHeader}>{selectedApto?.nombre || 'Apartamento'}</Text>
          <Text style={styles.modalItem}>📍 {selectedApto?.direccion_fisica}</Text>
          <Text style={styles.modalItem}>🏢 Piso: {selectedApto?.num_piso}</Text>
          <Text style={styles.modalItem}>🛏 Habitaciones: {selectedApto?.num_cuartos}</Text>
          <Text style={styles.modalItem}>🚿 Baños: {selectedApto?.num_bannos}</Text>
          <Text style={styles.modalItem}>🎨 Interior: {selectedApto?.color_interno}</Text>
          <Text style={styles.modalItem}>🌆 Exterior: {selectedApto?.color_externo}</Text>
          <Text style={styles.modalItem}>
            📐 Tamaño: {selectedApto?.tamanno_m2 ? `${selectedApto.tamanno_m2} m²` : '-'}
          </Text>
        </ScrollView>
      )}

      {/* Nuevo botón: Editar apartamento */}
      <TouchableOpacity
        style={styles.btnEdit}
        onPress={() => {
          cerrarModal();
          navigation.navigate('EditApto', { id_apto: selectedApto.id });
        }}
      >
        <Text style={styles.btnEditText}>Editar apartamento</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnDelete} onPress={confirmarEliminarApartamento}>
        <Text style={styles.btnDeleteText}>Eliminar apartamento</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnClose} onPress={cerrarModal}>
        <Text style={styles.btnCloseText}>Cerrar</Text>
      </TouchableOpacity>
    </Animated.View>
  </View>
</Modal>


      {/* Modal confirmación eliminar apartamento */}
      <Modal visible={modalConfirmVisible} transparent animationType="fade">
        <View style={styles.confirmContainer}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Confirmar eliminación</Text>
            <Text style={styles.confirmText}>
              ¿Está seguro de que desea eliminar este apartamento?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.cancelBtn]}
                onPress={() => setModalConfirmVisible(false)}
              >
                <Text style={styles.confirmBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.deleteBtn]}
                onPress={eliminarApartamento}
              >
                <Text style={styles.confirmBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal ver imagen y acciones */}
      <Modal visible={modalImageVisible} transparent animationType="fade">
        <View style={styles.imageModalContainer}>
          {!!aptoFotoActual?.uri && (
            <Image source={{ uri: aptoFotoActual.uri }} style={styles.imageFull} resizeMode="contain" />
          )}
          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity
              style={[styles.imageActionButton, { backgroundColor: '#dc2626' }]}
              onPress={confirmarEliminarFoto}
            >
              <Text style={styles.imageActionText}>Eliminar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.imageActionButton, { backgroundColor: '#3b82f6' }]}
              onPress={() => {
                setModalImageVisible(false);
                setAptoFotoActual(null);
              }}
            >
              <Text style={styles.imageActionText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal confirmación eliminar foto */}
      <Modal visible={modalConfirmFotoVisible} transparent animationType="fade">
        <View style={styles.confirmContainer}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Confirmar eliminación</Text>
            <Text style={styles.confirmText}>
              ¿Está seguro de que desea eliminar esta foto del apartamento?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.cancelBtn]}
                onPress={() => setModalConfirmFotoVisible(false)}
              >
                <Text style={styles.confirmBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.deleteBtn]}
                onPress={eliminarFoto}
                disabled={!aptoFotoActual?.id_apto || !aptoFotoActual?.id_foto}
              >
                <Text style={styles.confirmBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.7)' },
  container: { flex: 1, padding: 20 },
  header: { color: '#fff', fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    marginBottom: 16,
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },

  imageCarousel: { flexDirection: 'row', width: '100%' },
  imageCarouselItem: { width: 160, height: 120, marginRight: 6, borderRadius: 10 },

  imagePlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  placeholderText: { color: '#e2e8f0', fontSize: 14 },

  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  cardSubtitle: { color: '#cbd5e1', fontSize: 14, marginTop: 4 },
  cardAddress: { color: '#94a3b8', fontSize: 13, marginTop: 3 },

  btnAddPhoto: {
    backgroundColor: 'rgba(59,130,246,0.9)',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  btnAddPhotoText: { color: '#fff', fontSize: 22, fontWeight: '700' },

  footerButtons: { marginTop: 10 },
  btn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 6,
  },
  btnPrimary: { backgroundColor: '#3b82f6' },
  btnSecondary: { backgroundColor: '#64748b' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },

  // Modales
  loadingBox: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  loadingText: { color: '#fff', marginTop: 15, fontSize: 16 },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalBox: {
    backgroundColor: 'rgba(30,41,59,0.95)',
    padding: 20,
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  modalHeader: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  modalItem: { color: '#e2e8f0', fontSize: 16, marginVertical: 4 },

  btnDelete: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  btnDeleteText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  btnClose: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  btnCloseText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  confirmContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: {
    backgroundColor: 'rgba(30,41,59,0.95)',
    padding: 25,
    borderRadius: 16,
    width: '85%',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  confirmTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  confirmText: { color: '#e2e8f0', fontSize: 16, marginBottom: 20 },
  confirmButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelBtn: { backgroundColor: '#475569' },
  deleteBtn: { backgroundColor: '#dc2626' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Modal imagen
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  imageFull: { width: width * 0.9, height: height * 0.7, borderRadius: 15, marginBottom: 20 },
  imageButtonsContainer: { flexDirection: 'row', gap: 12 },
  imageActionButton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  imageActionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnEdit: {
  backgroundColor: '#10b981', // verde tipo success
  borderRadius: 10,
  paddingVertical: 12,
  marginTop: 10,
  alignItems: 'center',
},
btnEditText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '700',
},

});
