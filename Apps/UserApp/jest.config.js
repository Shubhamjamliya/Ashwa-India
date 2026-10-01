module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules[\\\\/](?!(react-native|@react-native|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-svg|@react-navigation|@react-native-async-storage)[\\\\/])',
  ],
  // lucide-react-native's package.json "exports" points Jest at its .mjs build,
  // which babel-jest doesn't transform by extension — resolve to the CJS build instead.
  moduleNameMapper: {
    '^lucide-react-native$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  setupFiles: ['./jest.setup.js'],
};
