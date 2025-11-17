import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Animated,
  ScrollView,
  Modal,
} from 'react-native';

export default function MenuScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTipo, setModalTipo] = useState(null); // "apartamentos", "contratos" o "pagos"

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const menuItems = [
    { label: 'Apartamentos', tipo: 'apartamentos' },
    { label: 'Contratos', tipo: 'contratos' },
    { label: 'Inquilinos', screen: 'ListaInquilinos' },
    { label: 'Pagos', tipo: 'pagos' },
    { label: 'Depósitos', screen: 'Depositos' },
  ];

  const handleNavigate = (screen) => {
    navigation.navigate(screen);
  };

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  const openModal = (tipo) => {
    setModalTipo(tipo);
    setModalVisible(true);
    scaleAnim.setValue(0.8);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setModalVisible(false));
  };

  const handleOption = (tipo, opcion) => {
    closeModal();

    if (tipo === 'apartamentos') {
      if (opcion === 'nuevo') navigation.navigate('Napartamento');
      if (opcion === 'lista') navigation.navigate('ListaApartamentos');
    } else if (tipo === 'contratos') {
      if (opcion === 'nuevo') navigation.navigate('NuevoContrato');
      if (opcion === 'lista') navigation.navigate('ListaContratos');
    } else if (tipo === 'pagos') {
      if (opcion === 'pendientes') navigation.navigate('ListaPagosPendientes');
      if (opcion === 'nopendientes') {
        navigation.navigate('ListaPagosCompletados');
      }
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View
          style={[
            styles.menuBox,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.header}>Panel Principal</Text>

          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() =>
                item.tipo ? openModal(item.tipo) : handleNavigate(item.screen)
              }
            >
              <Text style={styles.cardText}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[styles.card, styles.logoutCard]} onPress={handleLogout}>
            <Text style={styles.cardText}>Salir</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Modal dinámico (Apartamentos, Contratos o Pagos) */}
      <Modal visible={modalVisible} transparent animationType="none">
        <Animated.View style={[styles.modalContainer, { opacity: opacityAnim }]}>
          <Animated.View style={[styles.modalBox, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.modalHeader}>
              {modalTipo === 'apartamentos'
                ? 'Apartamentos'
                : modalTipo === 'contratos'
                ? 'Contratos'
                : 'Pagos'}
            </Text>

            {modalTipo === 'apartamentos' && (
              <>
                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={() => handleOption(modalTipo, 'nuevo')}
                >
                  <Text style={styles.modalBtnText}>Ingresar nuevo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={() => handleOption(modalTipo, 'lista')}
                >
                  <Text style={styles.modalBtnText}>Ver listado</Text>
                </TouchableOpacity>
              </>
            )}

            {modalTipo === 'contratos' && (
              <>
                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={() => handleOption(modalTipo, 'nuevo')}
                >
                  <Text style={styles.modalBtnText}>Nuevo contrato</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={() => handleOption(modalTipo, 'lista')}
                >
                  <Text style={styles.modalBtnText}>Ver listado</Text>
                </TouchableOpacity>
              </>
            )}

            {modalTipo === 'pagos' && (
              <>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#10b981' }]}
                  onPress={() => handleOption(modalTipo, 'pendientes')}
                >
                  <Text style={styles.modalBtnText}>Pagos pendientes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#f59e0b' }]}
                  onPress={() => handleOption(modalTipo, 'nopendientes')}
                >
                  <Text style={styles.modalBtnText}>Pagos no pendientes</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.modalClose}>Cancelar</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  menuBox: {
    width: '90%',
    alignItems: 'center',
  },
  header: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6,
    marginBottom: 25,
  },
  card: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 20,
    marginVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutCard: {
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderColor: 'rgba(239,68,68,0.4)',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: 'rgba(30,41,59,0.95)',
    padding: 25,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  modalHeader: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  modalBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
    marginVertical: 8,
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    color: '#93c5fd',
    marginTop: 15,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
