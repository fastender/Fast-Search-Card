// Mock devices data im Home Assistant Format
export const mockDevices = [
  // ==================== BELEUCHTUNG ====================
  {
    id: 'light.wohnzimmer_decke',
    domain: 'light',
    name: 'Deckenlampe Wohnzimmer',
    area: 'Wohnzimmer',
    state: 'on',
    attributes: {
      brightness: 180,
      color_temp: 350,
      friendly_name: 'Deckenlampe Wohnzimmer',
      supported_features: 44,
      min_mireds: 153,
      max_mireds: 500
    },
    isActive: true,
    icon: 'mdi:ceiling-light'
  },
  {
    id: 'light.schlafzimmer_nachttisch',
    domain: 'light',
    name: 'Nachttischlampe',
    area: 'Schlafzimmer',
    state: 'off',
    attributes: {
      brightness: null,
      friendly_name: 'Nachttischlampe',
      supported_features: 41
    },
    isActive: false,
    icon: 'mdi:lamp'
  },
  {
    id: 'light.kueche_arbeitsplatte',
    domain: 'light',
    name: 'Küchenbeleuchtung',
    area: 'Küche',
    state: 'on',
    attributes: {
      brightness: 255,
      rgb_color: [255, 214, 170],
      friendly_name: 'Küchenbeleuchtung',
      supported_features: 49
    },
    isActive: true,
    icon: 'mdi:light-strip'
  },

  // ==================== KLIMA ====================
  {
    id: 'climate.wohnzimmer',
    domain: 'climate',
    name: 'Klimaanlage Wohnzimmer',
    area: 'Wohnzimmer',
    state: 'cool',
    attributes: {
      temperature: 22,
      current_temperature: 24.5,
      target_temp_high: null,
      target_temp_low: null,
      humidity: 45,
      hvac_modes: ['off', 'heat', 'cool', 'heat_cool', 'dry', 'fan_only'],
      preset_mode: 'comfort',
      friendly_name: 'Klimaanlage Wohnzimmer'
    },
    isActive: true,
    icon: 'mdi:air-conditioner'
  },
  {
    id: 'climate.schlafzimmer',
    domain: 'climate',
    name: 'Thermostat Schlafzimmer',
    area: 'Schlafzimmer',
    state: 'heat',
    attributes: {
      temperature: 20,
      current_temperature: 19.2,
      hvac_modes: ['off', 'heat'],
      preset_mode: 'sleep',
      friendly_name: 'Thermostat Schlafzimmer'
    },
    isActive: true,
    icon: 'mdi:thermostat'
  },
  {
    id: 'climate.bad',
    domain: 'climate',
    name: 'Fußbodenheizung Bad',
    area: 'Badezimmer',
    state: 'off',
    attributes: {
      temperature: 22,
      current_temperature: 21,
      hvac_modes: ['off', 'heat'],
      friendly_name: 'Fußbodenheizung Bad'
    },
    isActive: false,
    icon: 'mdi:heating-coil'
  },

  // ==================== SENSOREN - TEMPERATUR & KLIMA ====================
  {
    id: 'sensor.temperature_wohnzimmer',
    domain: 'sensor',
    name: 'Temperatur Wohnzimmer',
    area: 'Wohnzimmer',
    state: '21.5',
    attributes: {
      unit_of_measurement: '°C',
      device_class: 'temperature',
      state_class: 'measurement',
      friendly_name: 'Temperatur Wohnzimmer'
    },
    isActive: true,
    icon: 'mdi:thermometer'
  },
  {
    id: 'sensor.humidity_bad',
    domain: 'sensor',
    name: 'Luftfeuchtigkeit Bad',
    area: 'Badezimmer',
    state: '65',
    attributes: {
      unit_of_measurement: '%',
      device_class: 'humidity',
      state_class: 'measurement',
      friendly_name: 'Luftfeuchtigkeit Bad'
    },
    isActive: true,
    icon: 'mdi:water-percent'
  },
  {
    id: 'sensor.temperature_aussen',
    domain: 'sensor',
    name: 'Außentemperatur',
    area: 'Garten',
    state: '15.3',
    attributes: {
      unit_of_measurement: '°C',
      device_class: 'temperature',
      state_class: 'measurement',
      friendly_name: 'Außentemperatur'
    },
    isActive: true,
    icon: 'mdi:thermometer'
  },
  {
    id: 'sensor.co2_wohnzimmer',
    domain: 'sensor',
    name: 'CO2 Wohnzimmer',
    area: 'Wohnzimmer',
    state: '425',
    attributes: {
      unit_of_measurement: 'ppm',
      device_class: 'carbon_dioxide',
      state_class: 'measurement',
      friendly_name: 'CO2 Wohnzimmer'
    },
    isActive: true,
    icon: 'mdi:molecule-co2'
  },

  // ==================== SENSOREN - ENERGIE ====================
  {
    id: 'sensor.power_consumption_total',
    domain: 'sensor',
    name: 'Gesamtverbrauch',
    area: 'Technikraum',
    state: '2450',
    attributes: {
      unit_of_measurement: 'W',
      device_class: 'power',
      state_class: 'measurement',
      friendly_name: 'Gesamtverbrauch'
    },
    isActive: true,
    icon: 'mdi:flash'
  },
  {
    id: 'sensor.solar_power',
    domain: 'sensor',
    name: 'Solar Produktion',
    area: 'Dach',
    state: '3200',
    attributes: {
      unit_of_measurement: 'W',
      device_class: 'power',
      state_class: 'measurement',
      friendly_name: 'Solar Produktion'
    },
    isActive: true,
    icon: 'mdi:solar-power'
  },
  {
    id: 'sensor.battery_charge',
    domain: 'sensor',
    name: 'Batterieladung',
    area: 'Technikraum',
    state: '85',
    attributes: {
      unit_of_measurement: '%',
      device_class: 'battery',
      state_class: 'measurement',
      friendly_name: 'Batterieladung'
    },
    isActive: true,
    icon: 'mdi:battery-80'
  },
  {
    id: 'sensor.energy_consumption_daily',
    domain: 'sensor',
    name: 'Tagesverbrauch',
    area: 'Technikraum',
    state: '12.4',
    attributes: {
      unit_of_measurement: 'kWh',
      device_class: 'energy',
      state_class: 'total_increasing',
      friendly_name: 'Tagesverbrauch',
      last_reset: '2024-01-01T00:00:00+00:00'
    },
    isActive: true,
    icon: 'mdi:counter'
  },

  // ==================== BINARY SENSOREN - BEWEGUNG ====================
  {
    id: 'binary_sensor.motion_flur',
    domain: 'binary_sensor',
    name: 'Bewegungsmelder Flur',
    area: 'Flur',
    state: 'off',
    attributes: {
      device_class: 'motion',
      friendly_name: 'Bewegungsmelder Flur'
    },
    isActive: false,
    icon: 'mdi:motion-sensor'
  },
  {
    id: 'binary_sensor.motion_garten',
    domain: 'binary_sensor',
    name: 'Bewegungsmelder Garten',
    area: 'Garten',
    state: 'on',
    attributes: {
      device_class: 'motion',
      friendly_name: 'Bewegungsmelder Garten',
      last_triggered: '2024-01-01T20:15:00+00:00'
    },
    isActive: true,
    icon: 'mdi:motion-sensor'
  },
  {
    id: 'binary_sensor.presence_wohnzimmer',
    domain: 'binary_sensor',
    name: 'Präsenz Wohnzimmer',
    area: 'Wohnzimmer',
    state: 'on',
    attributes: {
      device_class: 'presence',
      friendly_name: 'Präsenz Wohnzimmer'
    },
    isActive: true,
    icon: 'mdi:home'
  },

  // ==================== BINARY SENSOREN - TÜREN & FENSTER ====================
  {
    id: 'binary_sensor.door_haupteingang',
    domain: 'binary_sensor',
    name: 'Haustür',
    area: 'Eingang',
    state: 'off',
    attributes: {
      device_class: 'door',
      friendly_name: 'Haustür'
    },
    isActive: false,
    icon: 'mdi:door-closed'
  },
  {
    id: 'binary_sensor.window_kueche',
    domain: 'binary_sensor',
    name: 'Fenster Küche',
    area: 'Küche',
    state: 'on',
    attributes: {
      device_class: 'window',
      friendly_name: 'Fenster Küche'
    },
    isActive: true,
    icon: 'mdi:window-open'
  },
  {
    id: 'binary_sensor.garage_door',
    domain: 'binary_sensor',
    name: 'Garagentor',
    area: 'Garage',
    state: 'off',
    attributes: {
      device_class: 'garage_door',
      friendly_name: 'Garagentor'
    },
    isActive: false,
    icon: 'mdi:garage'
  },

  // ==================== SCHALTER ====================
  {
    id: 'switch.steckdose_wohnzimmer',
    domain: 'switch',
    name: 'Steckdose TV',
    area: 'Wohnzimmer',
    state: 'on',
    attributes: {
      friendly_name: 'Steckdose TV',
      power_consumption: 85
    },
    isActive: true,
    icon: 'mdi:power-socket-eu'
  },
  {
    id: 'switch.gartenpumpe',
    domain: 'switch',
    name: 'Gartenpumpe',
    area: 'Garten',
    state: 'off',
    attributes: {
      friendly_name: 'Gartenpumpe'
    },
    isActive: false,
    icon: 'mdi:water-pump'
  },
  {
    id: 'switch.weihnachtsbeleuchtung',
    domain: 'switch',
    name: 'Weihnachtsbeleuchtung',
    area: 'Garten',
    state: 'on',
    attributes: {
      friendly_name: 'Weihnachtsbeleuchtung'
    },
    isActive: true,
    icon: 'mdi:string-lights'
  },

  // ==================== COVER (ROLLÄDEN & JALOUSIEN) ====================
  {
    id: 'cover.rolladen_wohnzimmer',
    domain: 'cover',
    name: 'Rolladen Wohnzimmer',
    area: 'Wohnzimmer',
    state: 'closed',
    attributes: {
      current_position: 0,
      device_class: 'shutter',
      friendly_name: 'Rolladen Wohnzimmer'
    },
    isActive: false,
    icon: 'mdi:window-shutter'
  },
  {
    id: 'cover.jalousie_schlafzimmer',
    domain: 'cover',
    name: 'Jalousie Schlafzimmer',
    area: 'Schlafzimmer',
    state: 'open',
    attributes: {
      current_position: 75,
      current_tilt_position: 45,
      device_class: 'blind',
      friendly_name: 'Jalousie Schlafzimmer'
    },
    isActive: true,
    icon: 'mdi:blinds-open'
  },
  {
    id: 'cover.markise_terrasse',
    domain: 'cover',
    name: 'Markise Terrasse',
    area: 'Terrasse',
    state: 'closed',
    attributes: {
      current_position: 0,
      device_class: 'awning',
      friendly_name: 'Markise Terrasse'
    },
    isActive: false,
    icon: 'mdi:awning'
  },
  {
    id: 'cover.garage',
    domain: 'cover',
    name: 'Garagentor',
    area: 'Garage',
    state: 'closed',
    attributes: {
      current_position: 0,
      device_class: 'garage',
      friendly_name: 'Garagentor'
    },
    isActive: false,
    icon: 'mdi:garage-variant'
  },

  // ==================== MEDIA PLAYER ====================
  {
    id: 'media_player.wohnzimmer_tv',
    domain: 'media_player',
    name: 'Samsung TV',
    area: 'Wohnzimmer',
    state: 'off',
    attributes: {
      friendly_name: 'Samsung TV',
      device_class: 'tv',
      supported_features: 21005
    },
    isActive: false,
    icon: 'mdi:television'
  },
  {
    id: 'media_player.sonos_kueche',
    domain: 'media_player',
    name: 'Sonos Küche',
    area: 'Küche',
    state: 'playing',
    attributes: {
      volume_level: 0.35,
      is_volume_muted: false,
      media_content_type: 'music',
      media_title: 'Peaceful Piano',
      media_artist: 'Spotify',
      friendly_name: 'Sonos Küche',
      device_class: 'speaker'
    },
    isActive: true,
    icon: 'mdi:speaker'
  },
  {
    id: 'media_player.spotify',
    domain: 'media_player',
    name: 'Spotify',
    area: 'Überall',
    state: 'paused',
    attributes: {
      media_title: 'Liked Songs',
      friendly_name: 'Spotify Account',
      source_list: ['Sonos Küche', 'Samsung TV', 'Büro Echo']
    },
    isActive: false,
    icon: 'mdi:spotify'
  },

  // ==================== LOCK ====================
  {
    id: 'lock.haustuer',
    domain: 'lock',
    name: 'Haustürschloss',
    area: 'Eingang',
    state: 'locked',
    attributes: {
      friendly_name: 'Haustürschloss',
      code_format: '^\\d{4,6}$'
    },
    isActive: false,
    icon: 'mdi:lock'
  },
  {
    id: 'lock.garagentor',
    domain: 'lock',
    name: 'Garagenschloss',
    area: 'Garage',
    state: 'unlocked',
    attributes: {
      friendly_name: 'Garagenschloss'
    },
    isActive: true,
    icon: 'mdi:lock-open'
  },

  // ==================== VACUUM ====================
  {
    id: 'vacuum.roborock_s7',
    domain: 'vacuum',
    name: 'Roborock S7',
    area: 'Wohnzimmer',
    state: 'docked',
    attributes: {
      battery_level: 100,
      battery_icon: 'mdi:battery',
      fan_speed: 'balanced',
      fan_speed_list: ['silent', 'balanced', 'turbo', 'max'],
      friendly_name: 'Roborock S7'
    },
    isActive: false,
    icon: 'mdi:robot-vacuum'
  },

  // ==================== FAN ====================
  {
    id: 'fan.schlafzimmer',
    domain: 'fan',
    name: 'Deckenventilator',
    area: 'Schlafzimmer',
    state: 'on',
    attributes: {
      percentage: 66,
      speed_list: ['low', 'medium', 'high'],
      preset_mode: 'normal',
      friendly_name: 'Deckenventilator'
    },
    isActive: true,
    icon: 'mdi:fan'
  },

  // ==================== PERSON ====================
  {
    id: 'person.max',
    domain: 'person',
    name: 'Max',
    area: null,
    state: 'home',
    attributes: {
      editable: true,
      id: 'max',
      latitude: 52.520008,
      longitude: 13.404954,
      gps_accuracy: 10,
      source: 'device_tracker.iphone_max',
      friendly_name: 'Max'
    },
    isActive: true,
    icon: 'mdi:account'
  },
  {
    id: 'person.sarah',
    domain: 'person',
    name: 'Sarah',
    area: null,
    state: 'not_home',
    attributes: {
      editable: true,
      id: 'sarah',
      source: 'device_tracker.iphone_sarah',
      friendly_name: 'Sarah'
    },
    isActive: false,
    icon: 'mdi:account'
  },

  // ==================== DEVICE TRACKER ====================
  {
    id: 'device_tracker.iphone_max',
    domain: 'device_tracker',
    name: 'iPhone Max',
    area: null,
    state: 'home',
    attributes: {
      source_type: 'gps',
      battery_level: 67,
      friendly_name: 'iPhone Max'
    },
    isActive: true,
    icon: 'mdi:cellphone'
  },

  // ==================== CAMERA ====================
  {
    id: 'camera.eingang',
    domain: 'camera',
    name: 'Kamera Eingang',
    area: 'Eingang',
    state: 'recording',
    attributes: {
      access_token: 'xxx',
      friendly_name: 'Kamera Eingang',
      entity_picture: '/api/camera_proxy/camera.eingang'
    },
    isActive: true,
    icon: 'mdi:cctv'
  },

  // ==================== ALARM ====================
  {
    id: 'alarm_control_panel.haus',
    domain: 'alarm_control_panel',
    name: 'Alarmanlage',
    area: 'Haus',
    state: 'disarmed',
    attributes: {
      code_format: 'number',
      code_arm_required: false,
      friendly_name: 'Alarmanlage'
    },
    isActive: false,
    icon: 'mdi:shield-home'
  },

  // ==================== WEATHER ====================
  {
    id: 'weather.home',
    domain: 'weather',
    name: 'Wetter',
    area: null,
    state: 'cloudy',
    attributes: {
      temperature: 15,
      temperature_unit: '°C',
      humidity: 73,
      pressure: 1013,
      pressure_unit: 'hPa',
      wind_bearing: 270,
      wind_speed: 12,
      wind_speed_unit: 'km/h',
      visibility: 10,
      visibility_unit: 'km',
      precipitation: 0,
      precipitation_unit: 'mm',
      friendly_name: 'Wetter'
    },
    isActive: true,
    icon: 'mdi:weather-cloudy'
  },

  // ==================== AUTOMATION ====================
  {
    id: 'automation.bewegungsmelder_flur',
    domain: 'automation',
    name: 'Bewegungsmelder Flur',
    area: 'Flur',
    state: 'on',
    attributes: {
      last_triggered: '2024-01-01T19:45:00+00:00',
      mode: 'single',
      current: 0,
      friendly_name: 'Bewegungsmelder Flur'
    },
    isActive: true,
    icon: 'mdi:robot'
  },
  {
    id: 'automation.gute_nacht',
    domain: 'automation',
    name: 'Gute Nacht Routine',
    area: null,
    state: 'on',
    attributes: {
      last_triggered: '2024-01-01T22:00:00+00:00',
      mode: 'single',
      friendly_name: 'Gute Nacht Routine'
    },
    isActive: true,
    icon: 'mdi:sleep'
  },

  // ==================== SCRIPT ====================
  {
    id: 'script.alle_lichter_aus',
    domain: 'script',
    name: 'Alle Lichter aus',
    area: null,
    state: 'off',
    attributes: {
      last_triggered: null,
      mode: 'single',
      current: 0,
      friendly_name: 'Alle Lichter aus'
    },
    isActive: false,
    icon: 'mdi:lightbulb-group-off'
  },
  {
    id: 'script.kinoabend',
    domain: 'script',
    name: 'Kinoabend',
    area: 'Wohnzimmer',
    state: 'off',
    attributes: {
      last_triggered: '2024-01-01T20:00:00+00:00',
      mode: 'single',
      friendly_name: 'Kinoabend'
    },
    isActive: false,
    icon: 'mdi:movie-open'
  },

  // ==================== SCENE ====================
  {
    id: 'scene.entspannen',
    domain: 'scene',
    name: 'Entspannen',
    area: 'Wohnzimmer',
    state: 'scening',
    attributes: {
      entity_id: ['light.wohnzimmer', 'light.stehlampe'],
      friendly_name: 'Entspannen'
    },
    isActive: false,
    icon: 'mdi:sofa'
  },
  {
    id: 'scene.arbeiten',
    domain: 'scene',
    name: 'Arbeiten',
    area: 'Büro',
    state: 'scening',
    attributes: {
      entity_id: ['light.schreibtisch', 'light.regal'],
      friendly_name: 'Arbeiten'
    },
    isActive: false,
    icon: 'mdi:desk'
  },

  // ==================== INPUT BOOLEAN ====================
  {
    id: 'input_boolean.gaeste_modus',
    domain: 'input_boolean',
    name: 'Gäste Modus',
    area: null,
    state: 'off',
    attributes: {
      editable: true,
      friendly_name: 'Gäste Modus',
      icon: 'mdi:account-group'
    },
    isActive: false,
    icon: 'mdi:account-group'
  },
  {
    id: 'input_boolean.urlaubsmodus',
    domain: 'input_boolean',
    name: 'Urlaubsmodus',
    area: null,
    state: 'off',
    attributes: {
      editable: true,
      friendly_name: 'Urlaubsmodus',
      icon: 'mdi:beach'
    },
    isActive: false,
    icon: 'mdi:beach'
  },

  // ==================== INPUT NUMBER ====================
  {
    id: 'input_number.heizung_sollwert',
    domain: 'input_number',
    name: 'Heizung Sollwert',
    area: null,
    state: '21.0',
    attributes: {
      initial: 21,
      min: 16,
      max: 28,
      step: 0.5,
      mode: 'slider',
      unit_of_measurement: '°C',
      friendly_name: 'Heizung Sollwert'
    },
    isActive: true,
    icon: 'mdi:thermometer'
  },

  // ==================== TIMER ====================
  {
    id: 'timer.waschmaschine',
    domain: 'timer',
    name: 'Timer Waschmaschine',
    area: 'Keller',
    state: 'idle',
    attributes: {
      duration: '0:45:00',
      editable: true,
      friendly_name: 'Timer Waschmaschine'
    },
    isActive: false,
    icon: 'mdi:timer'
  }
];