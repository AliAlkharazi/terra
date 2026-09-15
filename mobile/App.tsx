import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from '@/navigation/RootNavigator';
import { colors } from '@/theme/tokens';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.moss900 }}>
      <StatusBar style="light" />
      <RootNavigator />
    </GestureHandlerRootView>
  );
}
