import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  ImageBackground,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { WebView } from 'react-native-webview'; // se usa solo en móviles
import CONFIG from './config';
export default function ContratoDetalle({ route }) {
  const { id_contrato } = route.params;
  const [contrato, setContrato] = useState(null);
  const [inquilinos, setInquilinos] = useState([]);
  const [propietarios, setPropietarios] = useState([{ nombre: '', cedula: '', calidades: '' }]);
  const [fincaInfo, setFincaInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState('');
  const [generando, setGenerando] = useState(false);
  const [pdfBase64, setPdfBase64] = useState(null);

  const showModal = (msg) => {
    setModalMsg(msg);
    setModalVisible(true);
  };

  // -----------------------------
  // Cargar contrato e inquilinos
  // -----------------------------
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          showModal('No se encontró token de sesión.');
          return;
        }

        const resContrato = await axios.get(`${CONFIG.API_URL}/contratos/${id_contrato}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setContrato(resContrato.data);

        const relResp = await axios.get(`${CONFIG.API_URL}/contratos/${id_contrato}/inquilinos`, {
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

        setInquilinos(detalles);
      } catch (err) {
        console.error('Error al cargar contrato o inquilinos:', err.response?.data || err.message);
        showModal('❌ Error al cargar la información del contrato.');
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [id_contrato]);

  // -----------------------------
  // Manejo de propietarios
  // -----------------------------
  const agregarPropietario = () => {
    setPropietarios([...propietarios, { nombre: '', cedula: '', calidades: '' }]);
  };

  const eliminarPropietario = (index) => {
    const nuevos = [...propietarios];
    nuevos.splice(index, 1);
    setPropietarios(nuevos);
  };

  const actualizarPropietario = (index, campo, valor) => {
    const nuevos = [...propietarios];
    nuevos[index][campo] = valor;
    setPropietarios(nuevos);
  };

  // -----------------------------
  // Generar PDF desde backend
  // -----------------------------
  const generarPDF = async () => {
    if (!fincaInfo || propietarios.some((p) => !p.nombre || !p.cedula || !p.calidades)) {
      showModal('Debe completar toda la información de propietarios y finca.');
      return;
    }
    if (!inquilinos.length) {
      showModal('El contrato no tiene inquilinos registrados.');
      return;
    }

    try {
      setGenerando(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showModal('No se encontró token de sesión.');
        return;
      }

      const body = {
        propietarios,
        fincaInfo,
        inquilinos: inquilinos.map((i) => ({
          nombre: `${i.nombre} ${i.p_apellido || ''} ${i.s_apellido || ''}`.trim(),
          cedula: i.cedula,
        })),
      };

      const resp = await axios.post(`${CONFIG.API_URL}/contratos/${id_contrato}/pdf`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const base64 = resp.data.pdf_base64;
      if (base64) {
        setPdfBase64(`data:application/pdf;base64,${base64}`);
      } else {
        showModal('No se recibió el PDF correctamente.');
      }
    } catch (err) {
      console.error('Error generando PDF:', err.response?.data || err.message);
      showModal('❌ Error al generar el PDF desde el servidor.');
    } finally {
      setGenerando(false);
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#000" />;
  }

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1592595896551-12b371d546d3?auto=format&fit=crop&w=1200&q=80',
      }}
      style={styles.background}
    >
      <View style={styles.overlay} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>🏠 Contrato #{id_contrato}</Text>

        {/* Propietarios */}
        <View style={styles.section}>
          <Text style={styles.label}>Propietarios:</Text>
          {propietarios.map((p, idx) => (
            <View key={idx} style={styles.propietarioBox}>
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                value={p.nombre}
                onChangeText={(v) => actualizarPropietario(idx, 'nombre', v)}
              />
              <TextInput
                style={styles.input}
                placeholder="Cédula"
                value={p.cedula}
                onChangeText={(v) => actualizarPropietario(idx, 'cedula', v)}
              />
              <TextInput
                style={styles.inputLargo}
                placeholder="Calidades (estado civil, profesión, domicilio...)"
                multiline
                value={p.calidades}
                onChangeText={(v) => actualizarPropietario(idx, 'calidades', v)}
              />
              {propietarios.length > 1 && (
                <TouchableOpacity style={styles.botonEliminar} onPress={() => eliminarPropietario(idx)}>
                  <Text style={styles.botonEliminarTexto}>Eliminar propietario</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.botonAgregar} onPress={agregarPropietario}>
            <Text style={styles.botonTexto}>+ Agregar propietario</Text>
          </TouchableOpacity>
        </View>

        {/* Finca */}
        <View style={styles.section}>
          <Text style={styles.label}>Información de la finca:</Text>
          <TextInput
            style={styles.input}
            placeholder="Provincia, Finca, Plano..."
            value={fincaInfo}
            onChangeText={setFincaInfo}
          />
        </View>

        {/* Inquilinos */}
        <View style={styles.section}>
          <Text style={styles.label}>Inquilinos:</Text>
          {inquilinos.length > 0 ? (
            inquilinos.map((i, idx) => (
              <Text key={idx} style={styles.textoInquilino}>
                {i.nombre} {i.p_apellido} {i.s_apellido} - {i.cedula}
              </Text>
            ))
          ) : (
            <Text style={[styles.textoInquilino, { fontStyle: 'italic' }]}>Sin inquilinos registrados</Text>
          )}
        </View>

        {/* Monto */}
        <View style={styles.section}>
          <Text style={styles.label}>Monto mensual:</Text>
          <Text style={styles.valor}>₡{contrato.monto_mensual_inicial}</Text>
          <Text style={styles.label}>Depósito:</Text>
          <Text style={styles.valor}>₡{contrato.monto_deposito_inicial}</Text>
        </View>

        {/* Botón PDF */}
        <TouchableOpacity style={styles.botonPDF} onPress={generarPDF} disabled={generando}>
          <Text style={styles.botonPDFTexto}>{generando ? 'Generando...' : '📄 Generar PDF'}</Text>
        </TouchableOpacity>

        {/* Modal de mensajes */}
        <Modal transparent visible={modalVisible} animationType="fade">
          <View style={styles.modal}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTexto}>{modalMsg}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCerrar}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal visor PDF */}
        <Modal visible={!!pdfBase64} animationType="slide">
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <TouchableOpacity
              onPress={() => setPdfBase64(null)}
              style={{ padding: 15, backgroundColor: '#1e293b' }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Cerrar PDF</Text>
            </TouchableOpacity>

            {Platform.OS === 'web' ? (
              <iframe
                src={pdfBase64}
                title="Contrato PDF"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <WebView originWhitelist={['*']} source={{ uri: pdfBase64 }} style={{ flex: 1 }} />
            )}
          </View>
        </Modal>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.85)' },
  container: { padding: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#fff' },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  label: { fontWeight: '700', color: '#f1f5f9', marginBottom: 8 },
  valor: { color: '#fff', fontSize: 16, marginBottom: 5 },
  propietarioBox: {
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginTop: 5,
  },
  inputLargo: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    height: 80,
    backgroundColor: '#fff',
    marginTop: 5,
  },
  botonAgregar: {
    backgroundColor: '#22c55e',
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  botonEliminar: {
    backgroundColor: '#dc2626',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  botonEliminarTexto: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  textoInquilino: { color: '#fff', marginVertical: 3 },
  botonPDF: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  botonPDFTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modal: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBox: { backgroundColor: '#1e293b', padding: 25, borderRadius: 10, width: '80%' },
  modalTexto: { color: '#fff', fontSize: 16, marginBottom: 10, textAlign: 'center' },
  modalCerrar: { color: '#93c5fd', fontWeight: 'bold', textAlign: 'center' },
});
