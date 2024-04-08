import { GlobalState } from "@/types/state";
import { PayloadAction } from "@reduxjs/toolkit";

export const globalActions = {
  setWallet: (state: GlobalState, action: PayloadAction<string>) => {
    state.wallet = action.payload;
  },
};
