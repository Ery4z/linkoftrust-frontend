// src/components/CreateProfileButton.tsx
"use client";

import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@mantine/core";
import ModalCreateProfile from "./ModalCreateProfile";
import { useWallet } from "@/context/WalletContext";
import { notifications } from "@mantine/notifications";
import { modifyPublicProfile } from "@/lib/contractData";

export const CreateProfileButton = forwardRef((props, ref) => {
  const [modalOpened, setModalOpened] = useState(false);
  const { wallet, accountId, network } = useWallet();
  const CONTRACT_ID =
    network === "testnet" ? "linkoftrust.testnet" : "linkoftrust.near";
  // Replace with your actual logic to retrieve the user's balance.
  const userBalance = 0; // update with actual balance if available

  const onConfirm = async (maxDeposit: number, maxGas: number) => {
    if (!wallet || !accountId) {
      notifications.show({
        title: "Error",
        message: "Wallet not initialized.",
        color: "red",
      });
      return;
    }
    try {
      await modifyPublicProfile(wallet, CONTRACT_ID, " ", maxGas, maxDeposit);
      notifications.show({
        title: "Account Created",
        message: "Your account has been created successfully.",
        color: "green",
      });
      setModalOpened(false);
    } catch (error) {
      console.error("Failed to create account:", error);
      notifications.show({
        title: "Error",
        message: "Failed to create account.",
        color: "red",
      });
    }
  };

  // Expose openModal (and optionally closeModal) so they can be called programmatically
  useImperativeHandle(ref, () => ({
    openModal: () => setModalOpened(true),
    closeModal: () => setModalOpened(false),
  }));

  return (
    <>
      <Button onClick={() => setModalOpened(true)}>Create Profile</Button>
      <ModalCreateProfile
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        userBalance={userBalance}
        onConfirm={onConfirm}
      />
    </>
  );
});
