export const RINGTONE_FILES = {
  default: require('../../assets/sounds/default.wav'),
  mechanical_bell: require('../../assets/sounds/mechanical_bell.wav'),
  digital_alarm: require('../../assets/sounds/digital_alarm.wav'),
  classic_ring: require('../../assets/sounds/classic_ring.wav'),
  soft_chime: require('../../assets/sounds/soft_chime.wav'),
  gentle_notification: require('../../assets/sounds/gentle_notification.wav'),
  electronic_beep: require('../../assets/sounds/electronic_beep.wav'),
};

export const RINGTONES = [
  { id: 'default', name: 'Default', icon: 'notifications', description: 'Standard notification' },
  {
    id: 'mechanical_bell',
    name: 'Mechanical Bell',
    icon: 'notifications-active',
    description: 'Ding Dong sound',
  },
  { id: 'digital_alarm', name: 'Digital Alarm', icon: 'alarm', description: 'Beep beep alarm' },
  {
    id: 'classic_ring',
    name: 'Classic Ring',
    icon: 'ring-volume',
    description: 'Phone ringtone',
  },
  { id: 'soft_chime', name: 'Soft Chime', icon: 'music-note', description: 'Gentle whisper' },
  {
    id: 'gentle_notification',
    name: 'Gentle Notification',
    icon: 'notifications-none',
    description: 'Polite reminder',
  },
  {
    id: 'electronic_beep',
    name: 'Electronic Beep',
    icon: 'volume-up',
    description: 'Robotic beep',
  },
];
