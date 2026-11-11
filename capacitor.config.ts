import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ph.edu.neust.bikego.app',
  appName: 'NEUST BikeGo',
  webDir: 'www',
  server: {
    // Allows cleartext HTTP so the Android APK can communicate with XAMPP Apache (e.g. http://192.168.x.x/neust-bike-api/)
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
