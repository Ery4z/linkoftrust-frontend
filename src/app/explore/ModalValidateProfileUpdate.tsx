// src/components/ModalValidateProfileUpdate.tsx
"use client";

import React, { useState, useEffect, use } from "react";
import {
    Modal,
    Grid,
    Group,
    TextInput,
    Button,
    Title,
    Text,
    Skeleton,
    useMantineTheme,
    List,
} from "@mantine/core";
import { useCoinPrice } from "@/context/CoinPriceContext";
import { useGasPrice } from "@/context/GasPriceContext";
interface ModalValidateProfileUpdateProps {
    opened: boolean;
    onClose: () => void;
    previousProfile: string;
    newProfile: string;
    userBalance: number; // in NEAR
    onConfirm: (maxDeposit: number, maxGas: number) => void;
}

export default function ModalValidateProfileUpdate({
    opened,
    onClose,
    previousProfile,
    newProfile,
    userBalance,
    onConfirm,
}: ModalValidateProfileUpdateProps) {
    const theme = useMantineTheme();

    // Simulate API call delay for dollar cost conversion
    const [pricesLoading, setPricesLoading] = useState(true);
    const { nearPrice } = useCoinPrice();
    const { gasPrice } = useGasPrice();
    useEffect(() => {
        if (nearPrice !== null) {
            setPricesLoading(false);
        }
    }, [nearPrice]);

    // Calculate additional characters (only positive difference)
    const additionalChars = Math.max(newProfile.length - previousProfile.length, 0);
    // Approx deposit needed: 1 character = 0.0001 NEAR
    const depositNeeded = additionalChars * 1e19 / 1e24;
    // We'll assume the estimated fee cost is the same as depositNeeded
    const maxTGasEstimated = 10;
    const [feeCostEstimated, setFeeCostEstimated] = useState<number | null>(null);
    useEffect(() => {
        if (gasPrice !== null) {
            setFeeCostEstimated(maxTGasEstimated * gasPrice / 1e24);
        }
    }, [gasPrice]);
    // Conversion rate (1 NEAR = $3)
    const nearToDollar = 3;

    // Local state for max deposit and gas fee inputs
    const [maxDeposit, setMaxDeposit] = useState<number>(0);
    const [maxGas, setMaxGas] = useState<number>(0);

    // Convert inputs to numbers
    const maxDepositNum = maxDeposit;
    const maxGasNum = maxGas

    // Update input defaults when estimated values change
    useEffect(() => {
        setMaxDeposit(depositNeeded);
        if (!feeCostEstimated) return;


        setMaxGas(maxTGasEstimated);
    }, [depositNeeded, maxTGasEstimated]);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Validate Profile Update"
            centered
            size="xl"
            overlayProps={{
                blur: 3,
                opacity: 0.55,
            }}
            transitionProps={{ transition: "fade", duration: 300 }}
        >
            <Grid gutter="md" grow className="mb-12">
                <Grid.Col span={6}>
                    <Title order={4}>Before</Title>
                    <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                        {previousProfile}
                    </Text>
                </Grid.Col>
                <Grid.Col span={6}>
                    <Title order={4}>After</Title>
                    <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                        {newProfile}
                    </Text>
                </Grid.Col>
            </Grid>

            <List spacing="sm">
                <Text>
                    Additional characters: <strong>{additionalChars}</strong>
                </Text>

                <Text>
                    Approximate deposit needed:{" "}
                    <strong>{depositNeeded.toFixed(5)} NEAR</strong> (~$
                    {!nearPrice ? (
                        <Skeleton width={20} height={16} className="inline-block" />
                    ) : (
                        `${(depositNeeded * nearPrice).toFixed(2)}`
                    )}
                    )
                </Text>

                <Text>
                    Your balance: <strong>{userBalance.toFixed(5)} NEAR</strong> (~$
                    {!nearPrice ? (
                        <Skeleton width={20} height={16} className="inline-block" />
                    ) : (
                        `${(userBalance * nearPrice).toFixed(2)}`
                    )}
                    )
                </Text>

                <Text>
                    Approximate fee cost:{" "}
                    {
                        feeCostEstimated ? (
                            <>
                                <strong>{feeCostEstimated.toFixed(5)} NEAR</strong> (~$
                                {!nearPrice ? (
                                    <Skeleton width={20} height={16} className="inline-block" />
                                ) : (
                                    `${(feeCostEstimated * nearPrice).toFixed(2)}`
                                )}
                            </>
                        ) : (
                            <Skeleton width={40} height={16} className="inline-block" />
                        )
                    }

                    )
                </Text>

                <TextInput
                    label="Max Deposit (NEAR)"
                    placeholder="e.g., 0.05"
                    value={maxDeposit.toPrecision(3)}
                    onChange={(event) => setMaxDeposit(parseFloat(event.currentTarget.value))}
                    error={
                        maxDepositNum < depositNeeded
                            ? "Attention: Deposit too low, update will fail"
                            : undefined
                    }
                />
                <TextInput
                    label="Max Gas Fee (TGas)"
                    placeholder="e.g., 0.001"
                    value={maxGas.toPrecision(3)}
                    onChange={(event) => setMaxGas(parseFloat(event.currentTarget.value))}
                    error={
                        maxGasNum < (feeCostEstimated || 0)
                            ? "Attention: Gas fee too low, update will fail"
                            : undefined
                    }
                />
            </List>

            <Group mt="md" justify="flex-end">
                <Button variant="default" onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={() => onConfirm(maxDepositNum, maxGasNum)}>
                    Confirm Update
                </Button>
            </Group>
        </Modal>
    );
}
