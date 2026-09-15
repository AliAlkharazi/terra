import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { WorldScreen } from '@/screens/WorldScreen';
import { AddTransactionScreen } from '@/screens/AddTransactionScreen';
import { DistrictDetailScreen } from '@/screens/DistrictDetailScreen';
import { EditBudgetScreen } from '@/screens/EditBudgetScreen';
import { AuthNavigator } from './AuthNavigator';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="World" component={WorldScreen} />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ headerShown: true, presentation: 'modal', title: '', headerStyle: { backgroundColor: colors.parchment } }}
      />
      <Stack.Screen
        name="DistrictDetail"
        component={DistrictDetailScreen}
        options={{ headerShown: true, title: '', headerStyle: { backgroundColor: colors.moss900 } }}
      />
      <Stack.Screen
        name="EditBudget"
        component={EditBudgetScreen}
        options={{ headerShown: true, presentation: 'modal', title: '', headerStyle: { backgroundColor: colors.parchment } }}
      />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);
  const token = useAuthStore((s) => s.token);

  // Not yet chosen login/register/offline -> show the gate.
  // Otherwise (token present OR explicitly chose offline) -> show the app.
  const showAuthFlow = !hasOnboarded && !token;

  return (
    <NavigationContainer>
      {showAuthFlow ? <AuthNavigator /> : <AppStack />}
    </NavigationContainer>
  );
}
