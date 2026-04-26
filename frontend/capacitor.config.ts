import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.careerxera.tax',
  appName: 'CareerXera Tax',
  webDir: 'out',
  server: {
    // Points to live production API so the app works without a local server
    url: 'https://tax.careerxera.com',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e3a8a',
      showSpinner: false,
    },
  },
};

export default config;
