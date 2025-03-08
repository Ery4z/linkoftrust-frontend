// src/components/ModalValidateUntrust.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    Modal,
    Group,
    TextInput,
    Button,
    Text,
    Skeleton,
    List,
    Title,
    Grid,
    Divider,
} from "@mantine/core";
import { useCoinPrice } from "@/context/CoinPriceContext";
import { useGasPrice } from "@/context/GasPriceContext";

interface ModalValidateUntrustProps {
    opened: boolean;
    onClose: () => void;
    userId: string;        // The user who will be untrusted
    userBalance: number;   // user's NEAR balance
    onConfirm: (maxDeposit: number, maxGas: number) => void;
}

/**
 * Displays a modal for confirming an "untrust" action. 
 * - Only requires deposit & fee (gas). 
 */
export default function ModalValidateUntrust({
    opened,
    onClose,
    userId,
    userBalance,
    onConfirm,
}: ModalValidateUntrustProps) {
    const { nearPrice } = useCoinPrice();
    const { gasPrice } = useGasPrice();

    // If `nearPrice` is still loading, display skeleton for USD equivalents
    const [pricesLoading, setPricesLoading] = useState(true);
    useEffect(() => {
        if (nearPrice !== null) {
            setPricesLoading(false);
        }
    }, [nearPrice]);

    // By default, assume no deposit is needed for "untrust" – set depositNeeded to 0
    const depositNeeded = 0;

    // We'll allow user to override TGas via input. Let's store TGas in state (default 10 TGas).
    const [tGas, setTGas] = useState<number>(10);

    // Fee cost estimated from tGas * gasPrice (which is in yoctoNEAR per gas).
    // e.g. 10 TGas * gasPrice / 1e12 to convert to NEAR
    const [feeCostEstimated, setFeeCostEstimated] = useState<number>(0);
    useEffect(() => {
        if (gasPrice !== null) {
            const cost = (tGas * gasPrice) / 1e12;
            setFeeCostEstimated(Math.max(cost, 0.00001));
        } else {
            setFeeCostEstimated(0.00001);
        }
    }, [tGas, gasPrice]);

    // Let user override deposit and fee amounts via text inputs
    const [maxDeposit, setMaxDeposit] = useState<number>(0);
    const [maxGas, setMaxGas] = useState<number>(0);

    const maxDepositNum = maxDeposit;
    const maxGasNum = maxGas;

    // Whenever the modal opens or fee cost changes, update default inputs
    useEffect(() => {
        if (opened) {
            // minimal overhead for untrust
            setMaxDeposit(depositNeeded);
            setMaxGas(tGas);
        }
    }, [opened, depositNeeded, tGas]);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Validate Untrust Action"
            centered
            size="xl"
            overlayProps={{ blur: 3, opacity: 0.55 }}
            transitionProps={{ transition: "fade", duration: 300 }}
        >
            <List spacing="sm" mb="md">
                <Text>
                    Action: <strong>Untrust {userId}</strong>
                </Text>

                <Text>
                    Calculated deposit (default = 0):{" "}
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

            <Grid gutter="md" grow>
                <Grid.Col span={6}>
                    <TextInput
                        label="Max Untrust Deposit (NEAR)"
                        placeholder="0.00000"
                        value={maxDeposit}
                        onChange={(e) => setMaxDeposit(parseFloat(e.currentTarget.value))}
                        error={
                            maxDepositNum < depositNeeded
                                ? "Warning: Deposit too low; untrust may fail."
                                : undefined
                        }
                        mb="sm"
                    />
                </Grid.Col>
                <Grid.Col span={6}>
                    <TextInput
                        label="Max Network Fee (TGas)"
                        placeholder="e.g., 10"
                        value={maxGas}
                        onChange={(e) => setMaxGas(parseFloat(e.currentTarget.value))}
                        error={
                            maxGasNum < feeCostEstimated
                                ? "Warning: Fee too low; untrust action may fail."
                                : undefined
                        }
                        mb="md"
                    />
                </Grid.Col>
            </Grid>



            <Group mt="md" justify="right">
                <Button variant="default" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    onClick={() => onConfirm(maxDepositNum, maxGasNum)}
                >
                    Confirm Untrust
                </Button>
            </Group>
        </Modal>
    );
}
