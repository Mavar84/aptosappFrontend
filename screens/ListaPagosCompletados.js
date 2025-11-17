import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Image,
  ImageBackground,
  TextInput,
  Picker,
   TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import CONFIG from './config';
export default function ListaPagosCompletados({ navigation }) {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState('');
  const [apartamentos, setApartamentos] = useState({});
  const [inquilinos, setInquilinos] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [fotosPorPago, setFotosPorPago] = useState({});

  const showModal = (msg) => {
    setModalMsg(msg);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setModalMsg('');
  };

  const obtenerApartamento = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${CONFIG.API_URL}/apartamentos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.nombre;
    } catch {
      return 'Apartamento no encontrado';
    }
  };

  const obtenerNombreInquilino = async (cedula) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const resp = await axios.get(`${CONFIG.API_URL}/inquilinos/${cedula}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { nombre, p_apellido, s_apellido } = resp.data || {};
      return [nombre, p_apellido, s_apellido].filter(Boolean).join(' ');
    } catch {
      return cedula;
    }
  };

  const cargarPagos = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${CONFIG.API_URL}/pagos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const completados = response.data.filter((pago) => pago.estado === 2);
      setPagos(completados);

      const nombresAptos = {};
      const nombresInq = {};

      for (const pago of completados) {
        try {
          const contrato = await axios.get(
            `${CONFIG.API_URL}/contratos/${pago.contrato_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const apartamentoId = contrato.data.id_apartamento ?? contrato.data.apartamento_id;
          nombresAptos[pago.contrato_id] = await obtenerApartamento(apartamentoId);
        } catch {
          nombresAptos[pago.contrato_id] = 'Sin apartamento';
        }

        if (!nombresInq[pago.inquilino_cedula]) {
          nombresInq[pago.inquilino_cedula] = await obtenerNombreInquilino(pago.inquilino_cedula);
        }
      }

      setApartamentos(nombresAptos);
      setInquilinos(nombresInq);
    } catch {
      showModal('Error al cargar los pagos completados.');
    } finally {
      setLoading(false);
    }
  };

  // Carga de fotos (lazy) al mostrar tarjeta
  const cargarFotosPago = async (id_pago) => {
    if (fotosPorPago[id_pago]) return; // ya cargadas
    try {
      const token = await AsyncStorage.getItem('token');
      const resp = await axios.get(`${CONFIG.API_URL}/fotos/pago/${id_pago}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFotosPorPago((prev) => ({ ...prev, [id_pago]: resp.data }));
    } catch (error) {
      console.error(`Error al cargar fotos del pago ${id_pago}:`, error);
    }
  };

  useEffect(() => {
    cargarPagos();
  }, []);

  const getIconForTipo = (tipo) => {
    switch (tipo) {
      case 1:
        return 'https://cdn-icons-png.flaticon.com/512/13872/13872629.png';
      case 2:
        return 'https://cdn-icons-png.flaticon.com/512/2489/2489669.png';
      case 3:
        return 'https://cdn-icons-png.flaticon.com/512/427/427112.png';
      case 4:
        return 'https://cdn-icons-png.flaticon.com/512/616/616494.png';
      case 5:
        return 'https://cdn-icons-png.flaticon.com/512/1788/1788637.png';
      default:
        return 'https://cdn-icons-png.flaticon.com/512/565/565547.png';
    }
  };

  const filtrarPagos = pagos.filter((pago) => {
    const nombreInquilino = (inquilinos[pago.inquilino_cedula] || '').toLowerCase();
    const nombreApto = (apartamentos[pago.contrato_id] || '').toLowerCase();
    const texto = busqueda.toLowerCase();

    const coincideTexto =
      nombreInquilino.includes(texto) || nombreApto.includes(texto) || texto === '';

    const coincideTipo =
      tipoFiltro === '' ||
      (tipoFiltro === 'mensualidad' && pago.tipo === 1) ||
      (tipoFiltro === 'deposito' && pago.tipo === 2) ||
      (tipoFiltro === 'agua' && pago.tipo === 3) ||
      (tipoFiltro === 'luz' && pago.tipo === 4) ||
      (tipoFiltro === 'parqueo' && pago.tipo === 5);

    return coincideTexto && coincideTipo;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Cargando pagos completados...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://cdn.pixabay.com/photo/2016/11/29/09/08/credit-1869235_1280.jpg' }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      {/* HEADER */}
      <View style={styles.headerFixed}>
        <Text style={styles.header}>Pagos Completados</Text>
        <View style={styles.filterBar}>
          <TextInput
            placeholder="Buscar..."
            placeholderTextColor="#ccc"
            style={styles.input}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tipoFiltro}
              onValueChange={(value) => setTipoFiltro(value)}
              style={styles.picker}
            >
              <Picker.Item label="Tipo de pago" value="" />
              <Picker.Item label="Mensualidad" value="mensualidad" />
              <Picker.Item label="Depósito" value="deposito" />
              <Picker.Item label="Agua" value="agua" />
              <Picker.Item label="Luz" value="luz" />
              <Picker.Item label="Parqueo" value="parqueo" />
            </Picker>
          </View>
        </View>
      </View>

      {/* LISTA */}
      <ScrollView contentContainerStyle={styles.containerGlobal}>
        {filtrarPagos.length === 0 ? (
          <Text style={styles.noData}>No hay pagos que coincidan con el filtro.</Text>
        ) : (
          filtrarPagos.map((pago) => {
            const inquilinoNombre = inquilinos[pago.inquilino_cedula] || 'Cargando...';
            const icono = getIconForTipo(pago.tipo);
            const fotos = fotosPorPago[pago.id] || [];

            return (
              <View
                key={pago.id}
                style={styles.card}
                onLayout={() => cargarFotosPago(pago.id)} // Lazy load al renderizar
              >
                <View style={styles.cardHeader}>
                  <Image source={{ uri: icono }} style={styles.icono} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {apartamentos[pago.contrato_id] || 'Cargando...'}
                    </Text>
                    <Text style={styles.cardTipo}>
                      {pago.tipo === 1
                        ? 'Mensualidad'
                        : pago.tipo === 2
                        ? 'Depósito'
                        : pago.tipo === 3
                        ? 'Agua'
                        : pago.tipo === 4
                        ? 'Luz'
                        : 'Parqueo'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardSubTitle}>
                  Contrato #{pago.contrato_id} — Inquilino: {inquilinoNombre}
                </Text>
                <Text style={styles.cardText}>
                  Monto pagado: ₡{Number(pago.monto_pagado).toFixed(2)}
                </Text>
                <Text style={styles.cardText}>
                  Fecha de pago:{' '}
                  {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString() : 'N/A'}
                </Text>
                <Text style={styles.cardText}>
                  Periodo: {pago.mes}/{pago.anno}
                </Text>
                {pago.detalle && <Text style={styles.cardText}>Detalle: {pago.detalle}</Text>}

                {/* FOTOS ASOCIADAS */}
                {fotos.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    {fotos.map((foto) => (
                      <Image
                        key={foto.id}
                        source={{ uri: `data:image/jpeg;base64,${(foto.base64_parte1 || '') + (foto.base64_parte2 || '')}`,}}
                        style={styles.fotoMiniatura}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={{ color: '#94a3b8', marginTop: 5 }}>Cargando fotos...</Text>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footerFixed}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.btn, styles.btnSecondary, { width: '90%' }]}
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.btnText}>Volver al menú</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL MENSAJE */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={cerrarModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalMsg}>{modalMsg}</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={cerrarModal}>
              <Text style={styles.modalBtnText}>Cerrar</Text>
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
  headerFixed: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: 'rgba(15,23,42,0.95)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    zIndex: 2,
  },
  header: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: '#64748b',
    borderWidth: 1,
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  pickerContainer: {
    width: 150,
    height: 38,
    borderColor: '#64748b',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
  },
  picker: { color: '#fff', height: 38, width: '100%' },
  footerFixed: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(15,23,42,0.9)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  containerGlobal: { paddingTop: 120, paddingBottom: 120, paddingHorizontal: 20 },
  card: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderColor: '#16a34a',
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icono: { width: 48, height: 48, marginRight: 10 },
  cardTitle: { color: '#facc15', fontSize: 18, fontWeight: 'bold' },
  cardTipo: { color: '#a5f3fc', fontSize: 15 },
  cardSubTitle: { color: '#cbd5e1', fontSize: 15, marginBottom: 8 },
  cardText: { color: '#fff', fontSize: 15, marginBottom: 3 },
  fotoMiniatura: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 8,
    borderColor: '#94a3b8',
    borderWidth: 1,
  },
  noData: { color: '#ccc', textAlign: 'center', marginTop: 40, fontSize: 16 },
  btn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnSecondary: { backgroundColor: '#3b82f6' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { backgroundColor: '#fff', padding: 25, borderRadius: 10, width: '80%' },
  modalMsg: { color: '#000', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  modalBtn: { backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 10 },
  modalBtnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
