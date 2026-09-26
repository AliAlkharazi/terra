import { DistrictId } from '@/types';

export type AuthStackParamList = {
  AuthGate: undefined;
  Login: undefined;
  Register: undefined;
};

export type RootStackParamList = {
  World: undefined;
  UnityWorld: undefined;
  AddTransaction: { districtId?: DistrictId };
  DistrictDetail: { districtId: DistrictId };
  EditBudget: { districtId: DistrictId };
};
