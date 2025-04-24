import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import GreatingScreen from './src/screens/GreatingScreen';
import PlayerSelectionScreen from './src/screens/PlayerSelectionScreen';
import HomeScreen from './src/screens/HomeScreen';
import CalculatorScreen from './src/screens/CalculatorScreen';
import DashboardScreen from './src/screens/DashboardScreen';

import Database from './src/database/Database';
import PlayerRepository from './src/database/PlayerRepository';
import GameRepository from './src/database/GameRepository';

const Stack = createStackNavigator();

export default function App() {

  useEffect(() => {
    const initDB = async () => {
      try {
        await Database.init();
        await PlayerRepository.init();
        await GameRepository.init();
        console.log('Database initialisée avec succès');
      } catch (error) {
        console.error('Erreur initialisation DB:', error);
      }
    };

    initDB();

    return () => {
      Database.close();  // proprement fermer la base si besoin
    };
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Greating">
        <Stack.Screen 
          name="Greating" 
          component={GreatingScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PlayerSelectionScreen" 
          component={PlayerSelectionScreen}
          options={{ title: 'Sélection des Joueurs' }}
        />
        <Stack.Screen 
          name="HomeScreen" 
          component={HomeScreen}
          options={{ title: 'Partie en Cours' }}
        />
        <Stack.Screen 
          name="CalculatorScreen" 
          component={CalculatorScreen}
          options={{ title: 'Calculate' }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'dashboard' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
