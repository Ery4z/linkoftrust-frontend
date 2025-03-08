// src/components/ModalValidateTrust.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    Modal,
    Group,
    TextInput,
    Button,
    Text,
    Skeleton,
    Slider,
    List,
    Title,
    Grid,
    Divider,
} from "@mantine/core";
import { useCoinPrice } from "@/context/CoinPriceContext";
import { useGasPrice } from "@/context/GasPriceContext";

interface ModalValidateTrustProps {
    opened: boolean;
    onClose: () => void;
    userId: string;             // The user for whom we are setting trust
    userBalance: number;        // user's NEAR balance
    onConfirm: (maxDeposit: number, maxGas: number, trustFactor: number) => void;
}

export default function ModalValidateTrust({
    opened,
    onClose,
    userId,
    userBalance,
    onConfirm,
}: ModalValidateTrustProps) {
    const { nearPrice } = useCoinPrice();
    const { gasPrice } = useGasPrice();

    // Indicate loading placeholders until nearPrice is loaded
    const [pricesLoading, setPricesLoading] = useState(true);
    useEffect(() => {
        if (nearPrice !== null) {
            setPricesLoading(false);
        }
    }, [nearPrice]);

    // Sliders: trustFactor [0..1], tGas [0..20]
    const [trustFactor, setTrustFactor] = useState<number>(0.5);
    const [tGas, setTGas] = useState<number>(10); // default 10 TGas

    // Deposit needed is derived from the length of JSON.stringify([userId, trustFactor])
    // * coefficient (0.0001 NEAR / character, for example)
    const [depositNeeded, setDepositNeeded] = useState(0);
    useEffect(() => {
        const dataString = JSON.stringify([userId, trustFactor]);
        const length = dataString.length;
        const coefficient = 0.0001;
        const needed = length * coefficient;
        setDepositNeeded(needed);
    }, [userId, trustFactor]);

    // feeCostEstimated is derived from (tGas * gasPrice / 1e12) if gasPrice is in yoctoNEAR/gas
    const [feeCostEstimated, setFeeCostEstimated] = useState<number>(0);
    useEffect(() => {
        if (gasPrice !== null) {
            // If gasPrice is yoctoNEAR/gas, then multiply by tGas * 1e12 to get NEAR
            const cost = (tGas * gasPrice) / 1e24;
            setFeeCostEstimated(cost);
        } else {
            setFeeCostEstimated(0.00001); // minimal fallback
        }
    }, [tGas, gasPrice]);

    // Let user override deposit and fee amounts via text input
    const [maxDeposit, setMaxDeposit] = useState<number>(0);
    const [maxGas, setMaxGas] = useState<number>(0);

    const maxDepositNum = maxDeposit;
    const maxGasNum = maxGas;

    // Whenever depositNeeded or feeCostEstimated changes, set new defaults (once modal is open)
    useEffect(() => {
        if (opened) {




            setMaxDeposit(depositNeeded * 1.1);
            setMaxGas(tGas * 1.1);
        }
    }, [opened, depositNeeded, tGas]);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Validate Trust Action"
            centered
            size="xl"
            overlayProps={{ blur: 3, opacity: 0.55 }}
            transitionProps={{ transition: "fade", duration: 300 }}
        >
            <List spacing="sm" mb="md">
                <Text>
                    Calculated deposit:{" "}
                    <strong>{depositNeeded.toFixed(5)} NEAR</strong> (~$
                    {pricesLoading || !nearPrice ? (
                        <Skeleton width={20} height={16} className="inline-block" />
                    ) : (
                        (depositNeeded * nearPrice).toFixed(2)
                    )}
                    )
                </Text>
                <Text>
                    Approximate network fee (based on {tGas} TGas):{" "}
                    <strong>{feeCostEstimated.toFixed(5)} NEAR</strong> (~$
                    {pricesLoading || !nearPrice ? (
                        <Skeleton width={20} height={16} className="inline-block" />
                    ) : (
                        (feeCostEstimated * nearPrice).toFixed(2)
                    )}
                    )
                </Text>
                <Text>
                    Your balance: <strong>{userBalance.toFixed(5)} NEAR</strong> (~$
                    {pricesLoading || !nearPrice ? (
                        <Skeleton width={20} height={16} className="inline-block" />
                    ) : (
                        (userBalance * nearPrice).toFixed(2)
                    )}
                    )
                </Text>
            </List>
            <Grid gutter="md" grow >
                <Grid.Col span={6}>

                    <TextInput
                        label="Max Trust Deposit (NEAR)"
                        placeholder="e.g., 0.05"
                        value={maxDeposit.toPrecision(3)}
                        onChange={(e) => setMaxDeposit(parseFloat(e.currentTarget.value))}
                        error={
                            maxDepositNum < depositNeeded
                                ? "Warning: Deposit too low; trust action may fail."
                                : undefined
                        }
                        mb="sm"
                    />
                </Grid.Col>
                <Grid.Col span={6}>

                    <TextInput
                        label="Max Network Fee (TGas)"
                        placeholder="e.g., 0.001"
                        value={maxGas.toPrecision(3)}
                        onChange={(e) => setMaxGas(parseFloat(e.currentTarget.value))}
                        error={
                            maxGasNum < feeCostEstimated
                                ? "Warning: Fee too low; trust action may fail."
                                : undefined
                        }
                        mb="md"
                    />
                </Grid.Col>
            </Grid>
            <Divider />

            <Title order={6} mt="lg" mb="xs">
                Trust Factor (public)
            </Title>
            <Slider
                value={trustFactor}
                onChange={setTrustFactor}
                min={0}
                max={1}
                step={0.01}
                label={(val) => val.toFixed(2)}
                marks={[
                    { value: 0, label: "Not Trusted" },
                    { value: 1, label: "Fully Trusted" },
                ]}
                mb="lg"
                className="px-20 pb-10"
            />




            <Group mt="md" justify="right">
                <Button variant="default" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    onClick={() => onConfirm(maxDepositNum, maxGasNum, trustFactor)}
                >
                    Confirm Trust
                </Button>
            </Group>
        </Modal>
    );
}
