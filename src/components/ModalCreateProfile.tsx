// src/components/ModalCreateAccount.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Group,
  TextInput,
  Button,
  Title,
  Text,
  Skeleton,
  List,
} from "@mantine/core";
import { useCoinPrice } from "@/context/CoinPriceContext";
import { useGasPrice } from "@/context/GasPriceContext";

interface ModalCreateAccountProps {
  opened: boolean;
  onClose: () => void;
  userBalance: number; // in NEAR
  onConfirm: (maxDeposit: number, maxGas: number) => void;
}

export default function ModalCreateProfile({
  opened,
  onClose,
  userBalance,
  onConfirm,
}: ModalCreateAccountProps) {
  const { nearPrice } = useCoinPrice();
  const { gasPrice } = useGasPrice();

  // Default values for deposit and gas fee
  const defaultDeposit = 0.05;
  const defaultGas = 10;
  const [maxDeposit, setMaxDeposit] = useState<number>(defaultDeposit);
  const [maxGas, setMaxGas] = useState<number>(defaultGas);

  // Optionally calculate an estimated fee cost (if gasPrice is available)
  const [feeCostEstimated, setFeeCostEstimated] = useState<number | null>(null);
  useEffect(() => {
    if (gasPrice !== null) {
      // Estimated fee cost in NEAR: (TGas * gasPrice) divided by 1e24
      setFeeCostEstimated((defaultGas * gasPrice) / 1e24);
    }
  }, [gasPrice, defaultGas]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Finalize Your Account"
      centered
      size="xl"
      overlayProps={{
        blur: 3,
        opacity: 0.55,
      }}
      transitionProps={{ transition: "fade", duration: 300 }}
    >
      <Title order={4}>Register on the Trust Network</Title>
      <Text mt="sm">
        You already have a NEAR wallet, but to fully join our Trust Network you
        need to register your account on our smart contract. This registration makes
        your profile visible and connectable to others.
      </Text>
      <Text mt="sm">
        A small deposit of NEAR tokens is required to cover the storage costs of your profile data.
        Don't worry – this deposit is automatically refunded if you decide to delete your account later.
        We recommend having at least <strong>0.5 NEAR</strong> in your wallet to cover this deposit and the
        necessary transaction fees.
      </Text>

      <List spacing="sm" mt="md">
        {/* <Text>
          Your balance:{" "}
          <strong>{userBalance.toFixed(5)} NEAR</strong>{" "}
          (~$
          {!nearPrice ? (
            <Skeleton width={20} height={16} className="inline-block" />
          ) : (
            `${(userBalance * nearPrice).toFixed(2)}`
          )}
          )
        </Text>
        <Text>
          Approximate fee cost:{" "}
          {feeCostEstimated ? (
            <>
              <strong>{feeCostEstimated.toFixed(5)} NEAR</strong>{" "}
              (~$
              {!nearPrice ? (
                <Skeleton width={20} height={16} className="inline-block" />
              ) : (
                `${(feeCostEstimated * nearPrice).toFixed(2)}`
              )}
              )
            </>
          ) : (
            <Skeleton width={40} height={16} className="inline-block" />
          )}
        </Text> */}
        <TextInput
          label="Deposit (NEAR)"
          placeholder="e.g., 0.05"
          value={maxDeposit.toString()}
          onChange={(event) =>
            setMaxDeposit(parseFloat(event.currentTarget.value))
          }
          error={maxDeposit <= 0 ? "Deposit must be greater than 0" : undefined}
        />
        <TextInput
          label="Gas Fee (TGas)"
          placeholder="e.g., 10"
          value={maxGas.toString()}
          onChange={(event) =>
            setMaxGas(parseFloat(event.currentTarget.value))
          }
          error={
            maxGas < (feeCostEstimated || 0)
              ? "Gas fee too low, transaction may fail"
              : undefined
          }
        />
      </List>

      <Group mt="md" justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => onConfirm(maxDeposit, maxGas)}>
          Confirm Create Account
        </Button>
      </Group>
    </Modal>
  );
}
