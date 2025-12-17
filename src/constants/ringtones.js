export const RINGTONE_FILES = {
  default: require('../../assets/sounds/default.wav'),
  beeper: require('../../assets/sounds/beeper.wav'),
  calm: require('../../assets/sounds/calm.wav'),
  chord: require('../../assets/sounds/chord.wav'),
  cloud: require('../../assets/sounds/cloud.wav'),
  glass: require('../../assets/sounds/glass.wav'),
  jinja: require('../../assets/sounds/jinja.wav'),
  polite: require('../../assets/sounds/polite.wav'),
  reverie: require('../../assets/sounds/reverie.wav'),
  sharp: require('../../assets/sounds/sharp.wav'),
};

export const RINGTONES = [
  { id: 'default', name: 'Default', icon: 'notifications', description: 'Standard system sound' },
  {
    id: 'polite',
    name: 'Polite',
    icon: 'notifications-active',
    description: 'Respectful notification',
  },
  {
    id: 'calm',
    name: 'Calm',
    icon: 'spa',
    description: 'Gentle ripple',
  },
  {
    id: 'glass',
    name: 'Glass',
    icon: 'local-drink',
    description: 'Crystal clear ping',
  },
  {
    id: 'chord',
    name: 'Chord',
    icon: 'music-note',
    description: 'Modern harmonious tone',
  },
  {
    id: 'cloud',
    name: 'Cloud',
    icon: 'cloud',
    description: 'Airy and light',
  },
  {
    id: 'jinja',
    name: 'Jinja',
    icon: 'temple-buddhist',
    description: 'Meditative chime',
  },
  {
    id: 'reverie',
    name: 'Reverie',
    icon: 'nights-stay',
    description: 'Dreamy ambience',
  },
  {
    id: 'beeper',
    name: 'Beeper',
    icon: 'notifications-active',
    description: 'Crisp ding sound',
  },
  {
    id: 'sharp',
    name: 'Sharp',
    icon: 'priority-high',
    description: 'Intense alert tone',
  },
];
