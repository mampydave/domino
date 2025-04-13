import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import GreatingScreen from './src/screens/GreatingScreen';
import PlayerSelectionScreen from './src/screens/PlayerSelectionScreen';
import HomeScreen from './src/screens/HomeScreen';
import CalculatorScreen from './src/screens/CalculatorScreen';

const Stack = createStackNavigator();

export default function App() {
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}