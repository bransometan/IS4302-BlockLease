"use client";

import { checkWallet } from "@/services/wallet";
import { store } from "@/store";
import React, { useEffect } from "react";
import { Provider } from "react-redux";

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    checkWallet();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
