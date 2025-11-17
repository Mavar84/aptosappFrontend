import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import CONFIG from './config';
export default function AddApartmentPhotosScreen({ route, navigation }) {
  const { id_apto } = route.params; // se pasa desde el formulario anterior
  const [fotos, setFotos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalMessage, setModalMessage] = useState('');
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const showModal = (message, type = 'success') => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(scaleAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setModalVisible(false);
        if (type === 'success') navigation.goBack();
      });
    }, 1800);
  };

  const seleccionarFotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        base64: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        const nuevas = result.assets.map((a) => ({
          uri: a.uri,
          base64: a.base64,
        }));
        setFotos([...fotos, ...nuevas]);
      }
    } catch (error) {
      console.log(error);
      showModal('Error al seleccionar imágenes', 'error');
    }
  };

  const subirFotos = async () => {
  if (fotos.length === 0) {
    showModal('Debe seleccionar al menos una imagen', 'error');
    return;
  }

  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      showModal('Debe iniciar sesión nuevamente', 'error');
      navigation.navigate('Login');
      return;
    }

    // Armar arreglo completo de fotos
    const listaFotos = fotos.map(f => {
      const mitad = Math.ceil(f.base64.length / 2);
      return {
        contexto: 'apartamento',
        base64_parte1: f.base64.slice(0, mitad),
        base64_parte2: f.base64.slice(mitad),
      };
    });

    await axios.post(
      `${CONFIG.API_URL}/fotos/apartamento/${id_apto}`,
      listaFotos,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    showModal('Fotos guardadas correctamente', 'success');
  } catch (e) {
    console.log('Error al subir fotos:', e.response?.data || e.message);
    showModal('No se pudieron guardar las fotos', 'error');
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

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Agregar Fotos del Apartamento</Text>

        <TouchableOpacity style={styles.btnSelect} onPress={seleccionarFotos}>
          <Text style={styles.btnText}>📷 Seleccionar fotos</Text>
        </TouchableOpacity>

        {fotos.length > 0 && (
          <View style={styles.previewContainer}>
            {fotos.map((f, i) => (
              <Image key={i} source={{ uri: f.uri }} style={styles.previewImage} />
            ))}
          </View>
        )}

        {fotos.length > 0 && (
          <TouchableOpacity style={styles.btnUpload} onPress={subirFotos}>
            <Text style={styles.btnText}>⬆️ Subir Fotos</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>← Volver</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal animado */}
      <Modal visible={modalVisible} transparent animationType="none">
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.modalBox,
              modalType === 'success' ? styles.modalSuccess : styles.modalError,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.modalText}>{modalMessage}</Text>
          </Animated.View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.7)' },
  container: { flexGrow: 1, padding: 20, alignItems: 'center' },
  header: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  btnSelect: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 20,
  },
  btnUpload: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 10,
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  previewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  previewImage: {
    width: 110,
    height: 110,
    borderRadius: 10,
    margin: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  link: { color: '#93c5fd', marginTop: 20, textAlign: 'center' },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    padding: 20,
    borderRadius: 16,
    minWidth: '70%',
    alignItems: 'center',
  },
  modalSuccess: { backgroundColor: '#10b981' },
  modalError: { backgroundColor: '#ef4444' },
  modalText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
