import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.diyetapp.mobile',
  appName: 'Diyet App',
  webDir: 'public',
  server: {
    url: 'https://diyet-seven.vercel.app/',
    cleartext: true
  }
};

export default config;
