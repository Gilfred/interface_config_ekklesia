import axiosInstance from './axiosInstance';

export enum EkklesiaContributionType {
  don = "don",
  offrande = "offrande",
  dime = "dime",
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface Contribution {
  id: number;
  user_id: number;
  type: EkklesiaContributionType;
  amount: number;
  payment_method_id: number;
  transaction_id: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
  delete_user_id: number | null;
  delete_date: string | null;
}

export interface ContributionCreate {
  user_id: number;
  type: EkklesiaContributionType;
  amount: number;
  payment_method_id: number;
  transaction_id?: string;
  status?: PaymentStatus;
}

export const getContributions = async (skip: number = 0, limit: number = 10): Promise<Contribution[]> => {
  const response = await axiosInstance.get<Contribution[]>('/contributions', {
    params: { skip, limit },
  });
  return response.data;
};

export const createContribution = async (contribution: ContributionCreate): Promise<Contribution> => {
  const response = await axiosInstance.post<Contribution>('/contributions', contribution);
  return response.data;
};
