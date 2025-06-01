import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider } from 'react-native-paper'; 

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
      Database.close(); 
    };
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer>
        <StatusBar style="dark" /> 
        <Stack.Navigator
          initialRouteName="Greating"
          screenOptions={{
            headerShown: true
          }}
        >
          <Stack.Screen 
            name="Greating" 
            component={GreatingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="PlayerSelectionScreen" 
            component={PlayerSelectionScreen}
          />
          <Stack.Screen 
            name="HomeScreen" 
            component={HomeScreen}
          />
          <Stack.Screen 
            name="CalculatorScreen" 
            component={CalculatorScreen}
          />
          <Stack.Screen
            name="DashboardScreen"
            component={DashboardScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}