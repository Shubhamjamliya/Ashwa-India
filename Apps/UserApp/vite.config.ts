import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import babel from 'vite-plugin-babel';

// react-native and several native packages ship raw Flow-typed source;
// Metro strips it via @react-native/babel-preset, Vite's esbuild pipeline
// doesn't, so route those specific node_modules paths through Babel too.
const rnPackagePattern = /node_modules[\\/](react-native|@react-native|react-native-.*|@react-native-community)[\\/].*\.jsx?$/;

export default defineConfig({
  plugins: [
    react(),
    babel({
      include: [rnPackagePattern],
      exclude: [],
      filter: rnPackagePattern,
      babelConfig: {
        presets: ['@react-native/babel-preset'],
        babelrc: false,
        configFile: false,
      },
    }),
  ],
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
    alias: [
      { find: /^react-native$/, replacement: 'react-native-web' },
      { find: /^lucide-react-native$/, replacement: 'lucide-react' },
    ],
  },
  optimizeDeps: {
    exclude: [
      'react-native',
      'react-native-gesture-handler',
      'react-native-safe-area-context',
      'react-native-screens',
      'react-native-svg',
      '@react-navigation/native',
      '@react-navigation/native-stack',
      '@react-navigation/bottom-tabs',
    ],
    rolldownOptions: {
      resolve: {
        extensions: ['.web.js', '.web.tsx', '.web.ts', '.web.jsx', '.js', '.jsx', '.ts', '.tsx'],
        alias: {
          'react-native$': 'react-native-web',
          'lucide-react-native': 'lucide-react',
        },
      },
    },
  },
  define: {
    global: 'window',
    __DEV__: JSON.stringify(true),
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
  },
});
