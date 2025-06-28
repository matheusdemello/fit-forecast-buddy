
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c63341cd799f4decba485cb60c0023b3',
  appName: 'Personal Workout Tracker',
  webDir: 'dist',
  server: {
    url: 'https://c63341cd-799f-4dec-ba48-5cb60c0023b3.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      iosKeychainPrefix: 'angular-sqlite-app-starter',
      iosBiometric: {
        biometricAuth: false,
        biometricTitle: "Biometric login for capacitor sqlite"
      },
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: "Biometric login for capacitor sqlite",
        biometricSubTitle: "Log in using your biometric"
      }
    }
  }
};

export default config;
