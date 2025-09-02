// src/utils/translations.js

const translations = {
  de: {
    // Generische States
    states: {
      // Basis States
      'on': 'Ein',
      'off': 'Aus',
      'home': 'Zuhause',
      'not_home': 'Abwesend',
      'unknown': 'Unbekannt',
      'unavailable': 'Nicht verfügbar',
      
      // Climate/HVAC States
      'heat': 'Heizen',
      'cool': 'Kühlen',
      'heat_cool': 'Auto',
      'dry': 'Entfeuchten',
      'fan_only': 'Nur Lüfter',
      'auto': 'Automatisch',
      'off': 'Aus',
      
      // Cover States
      'open': 'Offen',
      'closed': 'Geschlossen',
      'opening': 'Öffnet',
      'closing': 'Schließt',
      'stopped': 'Gestoppt',
      
      // Lock States
      'locked': 'Verriegelt',
      'unlocked': 'Entriegelt',
      'locking': 'Verriegelt...',
      'unlocking': 'Entriegelt...',
      'jammed': 'Verklemmt',
      
      // Alarm States
      'disarmed': 'Deaktiviert',
      'armed_home': 'Zuhause scharf',
      'armed_away': 'Abwesend scharf',
      'armed_night': 'Nacht scharf',
      'armed_vacation': 'Urlaub scharf',
      'armed_custom_bypass': 'Teilscharf',
      'pending': 'Aktiviert...',
      'triggered': 'Ausgelöst',
      'arming': 'Wird scharf...',
      
      // Media Player States
      'playing': 'Wiedergabe',
      'paused': 'Pausiert',
      'idle': 'Bereit',
      'standby': 'Standby',
      'off': 'Aus',
      'on': 'Ein',
      'buffering': 'Puffert',
      
      // Vacuum States
      'docked': 'Ladestation',
      'cleaning': 'Reinigt',
      'returning': 'Kehrt zurück',
      'paused': 'Pausiert',
      'idle': 'Bereit',
      'error': 'Fehler',
      
      // Weather States
      'clear-night': 'Klare Nacht',
      'cloudy': 'Bewölkt',
      'fog': 'Neblig',
      'hail': 'Hagel',
      'lightning': 'Gewitter',
      'lightning-rainy': 'Gewitterregen',
      'partlycloudy': 'Teilweise bewölkt',
      'pouring': 'Starkregen',
      'rainy': 'Regnerisch',
      'snowy': 'Schnee',
      'snowy-rainy': 'Schneeregen',
      'sunny': 'Sonnig',
      'windy': 'Windig',
      'windy-variant': 'Windig',
      'exceptional': 'Außergewöhnlich',
      
      // Camera States
      'recording': 'Aufnahme',
      'streaming': 'Streaming',
      'idle': 'Bereit',
      
      // Timer States
      'active': 'Aktiv',
      'idle': 'Inaktiv',
      'paused': 'Pausiert',
      
      // Scene States (HA internal)
      'scening': 'Szene'
    },
    
    // Device Class spezifische Übersetzungen für Binary Sensors
    deviceClasses: {
      battery: {
        on: 'Niedrig',
        off: 'Normal'
      },
      battery_charging: {
        on: 'Lädt',
        off: 'Lädt nicht'
      },
      cold: {
        on: 'Kalt',
        off: 'Normal'
      },
      connectivity: {
        on: 'Verbunden',
        off: 'Getrennt'
      },
      door: {
        on: 'Offen',
        off: 'Geschlossen'
      },
      garage_door: {
        on: 'Offen',
        off: 'Geschlossen'
      },
      gas: {
        on: 'Gas erkannt',
        off: 'Kein Gas'
      },
      heat: {
        on: 'Heiß',
        off: 'Normal'
      },
      light: {
        on: 'Licht erkannt',
        off: 'Dunkel'
      },
      lock: {
        on: 'Entriegelt',
        off: 'Verriegelt'
      },
      moisture: {
        on: 'Feucht',
        off: 'Trocken'
      },
      motion: {
        on: 'Bewegung',
        off: 'Keine Bewegung'
      },
      moving: {
        on: 'Bewegt sich',
        off: 'Stillstand'
      },
      occupancy: {
        on: 'Belegt',
        off: 'Frei'
      },
      opening: {
        on: 'Offen',
        off: 'Geschlossen'
      },
      plug: {
        on: 'Eingesteckt',
        off: 'Ausgesteckt'
      },
      power: {
        on: 'Ein',
        off: 'Aus'
      },
      presence: {
        on: 'Anwesend',
        off: 'Abwesend'
      },
      problem: {
        on: 'Problem',
        off: 'OK'
      },
      running: {
        on: 'Läuft',
        off: 'Gestoppt'
      },
      safety: {
        on: 'Unsicher',
        off: 'Sicher'
      },
      smoke: {
        on: 'Rauch erkannt',
        off: 'Kein Rauch'
      },
      sound: {
        on: 'Geräusch erkannt',
        off: 'Still'
      },
      tamper: {
        on: 'Manipulation',
        off: 'OK'
      },
      update: {
        on: 'Update verfügbar',
        off: 'Aktuell'
      },
      vibration: {
        on: 'Vibration',
        off: 'Keine Vibration'
      },
      window: {
        on: 'Offen',
        off: 'Geschlossen'
      }
    },
    
    // Domain spezifische Beschreibungen
    domains: {
      automation: 'Automatisierung',
      binary_sensor: 'Sensor',
      camera: 'Kamera',
      climate: 'Klima',
      cover: 'Abdeckung',
      device_tracker: 'Gerät',
      fan: 'Ventilator',
      input_boolean: 'Schalter',
      input_number: 'Nummer',
      light: 'Licht',
      lock: 'Schloss',
      media_player: 'Media Player',
      person: 'Person',
      scene: 'Szene',
      script: 'Skript',
      sensor: 'Sensor',
      switch: 'Schalter',
      timer: 'Timer',
      vacuum: 'Staubsauger',
      weather: 'Wetter',
      alarm_control_panel: 'Alarmanlage'
    },
    
    // Einheiten
    units: {
      '°C': '°C',
      '°F': '°F',
      '%': '%',
      'W': 'W',
      'kW': 'kW',
      'kWh': 'kWh',
      'A': 'A',
      'V': 'V',
      'km/h': 'km/h',
      'm/s': 'm/s',
      'mm': 'mm',
      'hPa': 'hPa',
      'bar': 'bar',
      'lx': 'lx',
      'lm': 'lm',
      'dB': 'dB',
      'ppm': 'ppm',
      'µg/m³': 'µg/m³'
    }
  },
  
  en: {
    // English translations
    states: {
      'on': 'On',
      'off': 'Off',
      'home': 'Home',
      'not_home': 'Away',
      'unknown': 'Unknown',
      'unavailable': 'Unavailable',
      
      // Climate
      'heat': 'Heating',
      'cool': 'Cooling',
      'heat_cool': 'Auto',
      'dry': 'Drying',
      'fan_only': 'Fan only',
      
      // Cover
      'open': 'Open',
      'closed': 'Closed',
      'opening': 'Opening',
      'closing': 'Closing',
      'stopped': 'Stopped',
      
      // Lock
      'locked': 'Locked',
      'unlocked': 'Unlocked',
      
      // Media Player
      'playing': 'Playing',
      'paused': 'Paused',
      'idle': 'Idle',
      'standby': 'Standby',
      
      // Vacuum
      'docked': 'Docked',
      'cleaning': 'Cleaning',
      'returning': 'Returning',
      'error': 'Error'
    },
    
    deviceClasses: {
      motion: {
        on: 'Motion detected',
        off: 'No motion'
      },
      door: {
        on: 'Open',
        off: 'Closed'
      },
      window: {
        on: 'Open',
        off: 'Closed'
      },
      presence: {
        on: 'Present',
        off: 'Away'
      }
    },
    
    domains: {
      light: 'Light',
      switch: 'Switch',
      sensor: 'Sensor',
      binary_sensor: 'Sensor',
      climate: 'Climate',
      cover: 'Cover',
      media_player: 'Media Player',
      lock: 'Lock',
      vacuum: 'Vacuum',
      person: 'Person',
      automation: 'Automation',
      script: 'Script',
      scene: 'Scene'
    }
  },
  
  fr: {
    // Französisch (Beispiel für weitere Sprachen)
    states: {
      'on': 'Allumé',
      'off': 'Éteint',
      'home': 'Maison',
      'not_home': 'Absent',
      'heat': 'Chauffage',
      'cool': 'Refroidissement'
    }
  },
  
  es: {
    // Spanisch
    states: {
      'on': 'Encendido',
      'off': 'Apagado',
      'home': 'En casa',
      'not_home': 'Ausente',
      'heat': 'Calefacción',
      'cool': 'Refrigeración'
    }
  }
};

// Haupt-Übersetzungsfunktion
export function translateState(state, domain, deviceClass, lang = 'de') {
  const langData = translations[lang] || translations['de'];
  
  // Spezielle Behandlung für Binary Sensors mit Device Class
  if (domain === 'binary_sensor' && deviceClass && langData.deviceClasses?.[deviceClass]) {
    return langData.deviceClasses[deviceClass][state] || 
           langData.states?.[state] || 
           state;
  }
  
  // Normale State-Übersetzung
  return langData.states?.[state] || state;
}

// Domain-Namen übersetzen
export function translateDomain(domain, lang = 'de') {
  const langData = translations[lang] || translations['de'];
  return langData.domains?.[domain] || domain;
}

// Formatierung für Sensor-Werte
export function formatSensorValue(state, attributes, lang = 'de') {
  const unit = attributes?.unit_of_measurement || '';
  const deviceClass = attributes?.device_class;
  
  // Numerische Sensoren
  if (!isNaN(parseFloat(state))) {
    const value = parseFloat(state);
    let formattedValue;
    
    // Spezielle Formatierung basierend auf Device Class
    switch (deviceClass) {
      case 'temperature':
        formattedValue = value.toFixed(1);
        break;
      case 'humidity':
      case 'battery':
        formattedValue = Math.round(value).toString();
        break;
      case 'power':
        // Watt zu Kilowatt konvertieren wenn > 1000
        if (value >= 1000) {
          formattedValue = (value / 1000).toFixed(1);
          return {
            value: formattedValue,
            unit: 'kW',
            displayText: `${formattedValue} kW`
          };
        }
        formattedValue = Math.round(value).toString();
        break;
      case 'energy':
        formattedValue = value.toFixed(1);
        break;
      default:
        formattedValue = value % 1 === 0 ? value.toString() : value.toFixed(1);
    }
    
    return {
      value: formattedValue,
      unit: unit,
      displayText: `${formattedValue}${unit ? ' ' + unit : ''}`
    };
  }
  
  // Nicht-numerische Sensoren
  return {
    value: state,
    unit: '',
    displayText: translateState(state, 'sensor', deviceClass, lang)
  };
}

// Relative Zeit formatieren (z.B. "vor 5 Minuten")
export function formatRelativeTime(timestamp, lang = 'de') {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const timeStrings = {
    de: {
      justNow: 'Gerade eben',
      minutesAgo: (m) => `vor ${m} ${m === 1 ? 'Minute' : 'Minuten'}`,
      hoursAgo: (h) => `vor ${h} ${h === 1 ? 'Stunde' : 'Stunden'}`,
      daysAgo: (d) => `vor ${d} ${d === 1 ? 'Tag' : 'Tagen'}`,
      longAgo: 'Vor langer Zeit'
    },
    en: {
      justNow: 'Just now',
      minutesAgo: (m) => `${m} ${m === 1 ? 'minute' : 'minutes'} ago`,
      hoursAgo: (h) => `${h} ${h === 1 ? 'hour' : 'hours'} ago`,
      daysAgo: (d) => `${d} ${d === 1 ? 'day' : 'days'} ago`,
      longAgo: 'Long time ago'
    }
  };
  
  const strings = timeStrings[lang] || timeStrings['de'];
  
  if (seconds < 60) return strings.justNow;
  if (minutes < 60) return strings.minutesAgo(minutes);
  if (hours < 24) return strings.hoursAgo(hours);
  if (days < 30) return strings.daysAgo(days);
  return strings.longAgo;
}

// Helfer für aktive Entitäten
export function isEntityActive(entity) {
  const { state, domain, attributes } = entity;
  
  // Spezielle Behandlung nach Domain
  switch (domain) {
    case 'light':
    case 'switch':
    case 'fan':
    case 'input_boolean':
    case 'automation':
      return state === 'on';
      
    case 'climate':
      return state !== 'off' && state !== 'unavailable';
      
    case 'cover':
      return state === 'open' || state === 'opening';
      
    case 'lock':
      return state === 'unlocked';
      
    case 'media_player':
      return state === 'playing' || state === 'paused';
      
    case 'vacuum':
      return state === 'cleaning' || state === 'returning';
      
    case 'person':
    case 'device_tracker':
      return state === 'home';
      
    case 'binary_sensor':
      return state === 'on';
      
    case 'sensor':
      // Sensoren sind immer "aktiv" wenn verfügbar
      return state !== 'unavailable' && state !== 'unknown';
      
    case 'alarm_control_panel':
      return state !== 'disarmed';
      
    case 'timer':
      return state === 'active';
      
    default:
      return state === 'on' || state === 'active';
  }
}

// Export default für einfachen Import
export default {
  translateState,
  translateDomain,
  formatSensorValue,
  formatRelativeTime,
  isEntityActive
};