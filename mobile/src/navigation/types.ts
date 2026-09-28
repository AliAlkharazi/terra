import { DistrictId } from '@/types';

export type AuthStackParamList = {
  AuthGate: undefined;
  Login: undefined;
  Register: undefined;
};

export type RootStackParamList = {
  World: undefined;
  AddTransaction: { districtId?: DistrictId; mode?: 'spend' | 'income' };
  DistrictDetail: { districtId: DistrictId };
  EditBudget: { districtId: DistrictId };
  Assign: undefined;
  Deposit: undefined;
  Move: { toId?: DistrictId } | undefined;
  Goals: undefined;
  More: undefined;
  Reports: undefined;
  Afford: undefined;
  Lock: undefined;
  Preview: undefined;
  ConnectBank: undefined;
  BankInbox: undefined;
};
