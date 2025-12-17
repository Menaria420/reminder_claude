import { LogBox } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

// Suppress known warnings
LogBox.ignoreLogs(['expo-notifications', 'Expo Go', 'development build', 'Push notifications']);

registerRootComponent(App);
