export interface GlobalState {
  wallet: string;
  leaseTokens: number;
}

export interface RootState {
  globalStates: GlobalState;
}
