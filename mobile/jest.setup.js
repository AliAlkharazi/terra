// AsyncStorage's real native module doesn't exist outside a running app,
// so tests need its official mock. This is the documented fix from
// https://react-native-async-storage.github.io/async-storage/docs/advanced/jest
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
