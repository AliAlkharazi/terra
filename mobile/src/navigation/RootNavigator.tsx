import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { WorldScreen } from '@/screens/WorldScreen';
import { AddTransactionScreen } from '@/screens/AddTransactionScreen';
import { DistrictDetailScreen } from '@/screens/DistrictDetailScreen';
import { EditBudgetScreen } from '@/screens/EditBudgetScreen';
import { AssignScreen } from '@/screens/AssignScreen';
import { DepositScreen } from '@/screens/DepositScreen';
import { MoveScreen } from '@/screens/MoveScreen';
import { GoalsScreen } from '@/screens/GoalsScreen';
import { MoreScreen } from '@/screens/MoreScreen';
import { ReportsScreen } from '@/screens/ReportsScreen';
import { AffordScreen } from '@/screens/AffordScreen';
import { LockScreen } from '@/screens/LockScreen';
import { PreviewScreen } from '@/screens/PreviewScreen';
import { ConnectBankScreen } from '@/screens/ConnectBankScreen';
import { BankInboxScreen } from '@/screens/BankInboxScreen';
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
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditBudget"
        component={EditBudgetScreen}
        options={{ headerShown: true, presentation: 'modal', title: '', headerStyle: { backgroundColor: colors.parchment } }}
      />
      <Stack.Screen
        name="Assign"
        component={AssignScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="Deposit"
        component={DepositScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="Move"
        component={MoveScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="More"
        component={MoreScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="Goals"
        component={GoalsScreen}
        options={{ headerShown: false, animation: 'fade', animationDuration: 420 }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Afford"
        component={AffordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Lock"
        component={LockScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="Preview"
        component={PreviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConnectBank"
        component={ConnectBankScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="BankInbox"
        component={BankInboxScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);
  const token = useAuthStore((s) => s.token);

  const showAuthFlow = !hasOnboarded && !token;

  return (
    <NavigationContainer>
      {showAuthFlow ? <AuthNavigator /> : <AppStack />}
    </NavigationContainer>
  );
}
