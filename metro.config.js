const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Suppress console warnings at Metro bundler level
const originalProcessLog = global.console.log;
const originalProcessWarn = global.console.warn;
const originalProcessError = global.console.error;

global.console.log = (...args) => {
  const msg = String(args[0] || '');
  if (msg.includes('expo-notifications') || msg.includes('Expo Go')) return;
  originalProcessLog.apply(console, args);
};

global.console.warn = (...args) => {
  const msg = String(args[0] || '');
  if (
    msg.includes('expo-notifications') ||
    msg.includes('Expo Go') ||
    msg.includes('development build') ||
    msg.includes('functionality is not fully supported')
  ) return;
  originalProcessWarn.apply(console, args);
};

global.console.error = (...args) => {
  const msg = String(args[0] || '');
  if (
    msg.includes('expo-notifications: Android Push') ||
    msg.includes('remote notifications') ||
    msg.includes('removed from Expo Go')
  ) return;
  originalProcessError.apply(console, args);
};

module.exports = config;
