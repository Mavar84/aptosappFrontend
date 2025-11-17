import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import MenuScreen from '../screens/MenuScreen';
import NewApartmentScreen from '../screens/NewApartmentScreen';
import NewApartmentScreenfotos from '../screens/AddApartmentPhotosScreen';
import EditApto from '../screens/EditApto';

import ListApartments from '../screens/ApartmentsListScreen';
import NuevoContrato from '../screens/NuevoContrato';
import InquilinoCrear from '../screens/InquilinosContrato';
import ListaContratos from '../screens/ListaContratos';
import EditarContrato from '../screens/EditarContrato';

import ContratoDetalle from '../screens/ContratoDetalle';
import ListaInquilinos from '../screens/ListaInquilinos';

import ListaPagosPendientes from '../screens/ListaPagosPendientes';
import PagoDetalleScreen from '../screens/PagoDetalleScreen';
import ListaPagosCompletados from '../screens/ListaPagosCompletados';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
         <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="Napartamento" component={NewApartmentScreen} />
            <Stack.Screen name="AddApartmentPhotos" component={NewApartmentScreenfotos} />
            <Stack.Screen name="ListaApartamentos" component={ListApartments} />
            <Stack.Screen name="EditApto" component={EditApto} />
           <Stack.Screen name="NuevoContrato" component={NuevoContrato} />
         <Stack.Screen name="InquilinoCrear" component={InquilinoCrear} />
         <Stack.Screen name="ListaContratos" component={ListaContratos} />
         <Stack.Screen name="EditarContrato" component={EditarContrato} />
          <Stack.Screen name="ContratoDetalle" component={ContratoDetalle} />
         <Stack.Screen name="ListaInquilinos" component={ListaInquilinos} />
         <Stack.Screen name="ListaPagosPendientes" component={ListaPagosPendientes} />
         <Stack.Screen name="PagoDetalleScreen" component={PagoDetalleScreen} />
         <Stack.Screen name="ListaPagosCompletados" component={ListaPagosCompletados} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
