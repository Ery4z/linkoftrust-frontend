// src/context/UserRepositoryContext.tsx
"use client";

import React, { createContext, useContext, useState } from "react";
import { getUserData, UserDataView } from "@/lib/contractData";

export interface UserDataRecord {
    data: UserDataView;
    fullyFetched: boolean; // true if fully fetched, false if only partially fetched
    updatedAt: number;     // timestamp in milliseconds
}

interface UserRepositoryContextType {
    // Map keyed by hashed user id
    users: Map<string, UserDataRecord>;
    // Add or update a user record.
    updateUser: (hashedUserId: string, data: UserDataView, fullyFetched: boolean) => void;
    // Retrieve a user record.
    getUser: (hashedUserId: string) => UserDataRecord | undefined;

    // Fetch a user record.
    fetchUser: (hashedUserId: string, contractId: string, network: "testnet" | "mainnet") => Promise<void>;
    // Optional: remove a user record.
    removeUser: (hashedUserId: string) => void;
}

const UserRepositoryContext = createContext<UserRepositoryContextType>({
    users: new Map(),
    updateUser: () => { },
    fetchUser: async () => { },
    getUser: () => undefined,
    removeUser: () => { },
});

export const useUserRepository = () => useContext(UserRepositoryContext);

export const UserRepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<Map<string, UserDataRecord>>(new Map());


    const fetchUser = async (hashedUserId: string, contractId: string, network: "testnet" | "mainnet") => {
        const userData: UserDataView | null = await getUserData(contractId, hashedUserId, network);
        if (!userData) return;
        updateUser(userData.hashed_user_id, userData, true);
        console.log(`Fetched user ${hashedUserId}`);
    };

    const updateUser = (hashedUserId: string, data: UserDataView, fullyFetched: boolean) => {
        setUsers((prev) => {
            const newMap = new Map(prev);
            newMap.set(hashedUserId, {
                data,
                fullyFetched,
                updatedAt: Date.now(),
            });
            return newMap;
        });
    };

    const getUser = (hashedUserId: string) => {
        return users.get(hashedUserId);
    };

    const removeUser = (hashedUserId: string) => {
        setUsers((prev) => {
            const newMap = new Map(prev);
            newMap.delete(hashedUserId);
            return newMap;
        });
    };

    return (
        <UserRepositoryContext.Provider value={{ users, updateUser, getUser, fetchUser, removeUser }}>
            {children}
        </UserRepositoryContext.Provider>
    );
};
