import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Image,
  ImageBackground,
  TextInput,
  Picker,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import CONFIG from './config';
export default function ListaPagosPendientes({ navigation }) {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState('');
  const [apartamentos, setApartamentos] = useState({});
  const [inquilinos, setInquilinos] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');

  const [modalMontoVisible, setModalMontoVisible] = useState(false);
  const [montoInput, setMontoInput] = useState('');
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [actualizando, setActualizando] = useState(false);

  const showModal = (msg) => {
    setModalMsg(msg);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setModalMsg('');
  };

  const abrirModalMonto = (pago) => {
    setPagoSeleccionado(pago);
    setMontoInput('');
    setModalMontoVisible(true);
  };

  const cerrarModalMonto = () => {
    setModalMontoVisible(false);
    setPagoSeleccionado(null);
  };

  // ACTUALIZAR MONTO — ENVÍA TODOS LOS CAMPOS DEL PAGO CON EL NUEVO MONTO
  const actualizarMonto = async () => {
    if (!montoInput || isNaN(montoInput)) {
      showModal('Ingrese un monto válido.');
      return;
    }

    try {
      setActualizando(true);
      const token = await AsyncStorage.getItem('token');

      // Enviamos todos los datos esperados por el backend
      const datosActualizados = {
        contrato_id: pagoSeleccionado.contrato_id,
        tipo: pagoSeleccionado.tipo,
        estado: pagoSeleccionado.estado,
        monto_esperado: parseFloat(montoInput),
        monto_pagado: pagoSeleccionado.monto_pagado,
        monto_adeudado_de_este_pago: parseFloat(montoInput),
        es_pago_completo: pagoSeleccionado.es_pago_completo ?? false,
        fecha_pago: pagoSeleccionado.fecha_pago,
        fecha_vence: pagoSeleccionado.fecha_vence,
        mes: pagoSeleccionado.mes,
        anno: pagoSeleccionado.anno,
        detalle: pagoSeleccionado.detalle,
        inquilino_cedula: pagoSeleccionado.inquilino_cedula,
      };

      await axios.put(
        `${CONFIG.API_URL}/pagos/${pagoSeleccionado.id}`,
        datosActualizados,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await cargarPagos();
      cerrarModalMonto();
      showModal('Monto actualizado correctamente.');
    } catch (error) {
      console.error(error);
      showModal('Error al actualizar el monto.');
    } finally {
      setActualizando(false);
    }
  };

  const obtenerApartamento = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${CONFIG.API_URL}/apartamentos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.nombre;
    } catch (error) {
      console.error(`Error al obtener apartamento ${id}`, error);
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
    } catch (e) {
      console.error(`Error al obtener inquilino ${cedula}`, e);
      return cedula;
    }
  };

  const cargarPagos = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${CONFIG.API_URL}/pagos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const pendientes = response.data.filter((pago) => pago.estado === 1);
      setPagos(pendientes);

      const nombresAptos = {};
      const nombresInq = {};

      for (const pago of pendientes) {
        try {
          const contrato = await axios.get(
           `${CONFIG.API_URL}/contratos/${pago.contrato_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const apartamentoId = contrato.data.id_apartamento ?? contrato.data.apartamento_id;
          const nombreApto = await obtenerApartamento(apartamentoId);
          nombresAptos[pago.contrato_id] = nombreApto;
        } catch (err) {
          nombresAptos[pago.contrato_id] = 'Sin apartamento';
        }

        if (!nombresInq[pago.inquilino_cedula]) {
          nombresInq[pago.inquilino_cedula] = await obtenerNombreInquilino(pago.inquilino_cedula);
        }
      }

      setApartamentos(nombresAptos);
      setInquilinos(nombresInq);
    } catch (error) {
      console.error(error);
      showModal('Error al cargar los pagos pendientes.');
    } finally {
      setLoading(false);
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
        <Text style={{ color: '#fff', marginTop: 10 }}>Cargando pagos pendientes...</Text>
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
        <Text style={styles.header}>Pagos Pendientes</Text>
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
            const montoCero = Number(pago.monto_esperado) === 0;
            const esAguaOLuz = pago.tipo === 3 || pago.tipo === 4;
            const inquilinoNombre = inquilinos[pago.inquilino_cedula] || 'Cargando...';
            const icono = getIconForTipo(pago.tipo);

            return (
              <View key={pago.id} style={styles.card}>
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
                  Monto esperado: ₡{Number(pago.monto_esperado).toFixed(2)}
                </Text>
                <Text style={styles.cardText}>
                  Monto adeudado: ₡{Number(pago.monto_adeudado_de_este_pago || 0).toFixed(2)}
                </Text>
                <Text style={styles.cardText}>
                  Fecha vence:{' '}
                  {pago.fecha_vence ? new Date(pago.fecha_vence).toLocaleDateString() : 'N/A'}
                </Text>
                <Text style={styles.cardText}>
                  Periodo: {pago.mes}/{pago.anno}
                </Text>
                {pago.detalle && <Text style={styles.cardText}>Detalle: {pago.detalle}</Text>}

                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={() =>
                    showModal(`Pago ${pago.id}\nPendiente de abono o pago total.\nApartamento: ${
                      apartamentos[pago.contrato_id] || '...'
                    }\nInquilino: ${inquilinoNombre}`)
                  }
                >
                  <Text style={styles.btnText}>Ver detalle</Text>
                </TouchableOpacity>

                {esAguaOLuz && montoCero && (
                  <TouchableOpacity
                    style={[styles.btn, styles.btnWarning]}
                    onPress={() => abrirModalMonto(pago)}
                  >
                    <Text style={styles.btnText}>Registrar monto a pagar</Text>
                  </TouchableOpacity>
                )}

                {/* NUEVO BOTÓN DE PAGO */}
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary, { marginTop: 10 }]}
                  onPress={() => navigation.navigate('PagoDetalleScreen', { id: pago.id })}
                >
                  <Text style={styles.btnText}>💳 Pagar</Text>
                </TouchableOpacity>
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

      {/* MODALES */}
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

      <Modal
        visible={modalMontoVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModalMonto}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalMsg}>
              Ingrese el monto para {pagoSeleccionado?.tipo === 3 ? 'agua' : 'luz'}
            </Text>
            <TextInput
              placeholder="₡ Monto"
              placeholderTextColor="#999"
              keyboardType="numeric"
              style={styles.inputMonto}
              value={montoInput}
              onChangeText={setMontoInput}
            />
            {actualizando ? (
              <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 10 }} />
            ) : (
              <TouchableOpacity style={styles.modalBtn} onPress={actualizarMonto}>
                <Text style={styles.modalBtnText}>Actualizar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#6b7280', marginTop: 10 }]}
              onPress={cerrarModalMonto}
            >
              <Text style={styles.modalBtnText}>Cancelar</Text>
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderColor: '#64748b',
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icono: { width: 48, height: 48, marginRight: 10 },
  cardTitle: { color: '#facc15', fontSize: 18, fontWeight: 'bold' },
  cardTipo: { color: '#a5f3fc', fontSize: 15 },
  cardSubTitle: { color: '#cbd5e1', fontSize: 15, marginBottom: 8 },
  cardText: { color: '#fff', fontSize: 15, marginBottom: 3 },
  noData: { color: '#ccc', textAlign: 'center', marginTop: 40, fontSize: 16 },
  btn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#10b981', marginTop: 10 },
  btnSecondary: { backgroundColor: '#3b82f6' },
  btnWarning: { backgroundColor: '#f59e0b', marginTop: 10 },
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
  inputMonto: {
    borderColor: '#2563eb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
