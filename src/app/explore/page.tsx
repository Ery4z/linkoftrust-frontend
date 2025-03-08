// src/app/explore/page.tsx
"use client";

import React, { useEffect, useState, useMemo, useRef, use, Suspense } from "react";
import {
    Title,
    TextInput,
} from "@mantine/core";
import { notifications, showNotification } from "@mantine/notifications";
import {
    pollAllUsers,
    pollMyUser,
    UserDataView,
    hashAccountId,
    pollUsers,
} from "@/lib/contractData";
import {
    buildTrustNetworkGraph,
    mergeTrustNetworkGraph,
    TrustNetworkGraph,
} from "@/lib/trustNetwork";
import debounce from "lodash.debounce";
import TrustGraph from "./TrustTree";
import { ProfileCard } from "./ProfileCard";
import { ReactFlowProvider } from "@xyflow/react";
import { SelectedNodeContext } from "./SelectedNodeContext";
import { useWallet } from "@/context/WalletContext";
import { useSearchParams } from "next/navigation";
import { useUserRepository } from "@/context/UserRepositoryContext";
import { SearchBar, SearchMode } from "@/components/SearchBar";
import ModalCreateProfile from "@/components/ModalCreateProfile";
import { create } from "domain";
import { CreateProfileButton } from "@/components/CreateProfileButton";
// The contract ID is now set dynamically based on network:
const getContractId = (network: "testnet" | "mainnet") =>
    network === "testnet" ? "linkoftrust.testnet" : "linkoftrust.near";

export default function ExplorePage() {
    const { wallet, accountId, network } = useWallet();
    const { users, updateUser, fetchUser } = useUserRepository();
    const [myUserData, setMyUserData] = useState<UserDataView | null>(null);
    const [trustGraph, setTrustGraph] = useState<TrustNetworkGraph | null>(null);
    const [message, setMessage] = useState("");
    const [focusUserId, setFocusUserId] = useState<string | null>(null);
    const profileButtonRef = useRef<any>(null);
    // State for all users
    const [allUserHashed, setAllUserHashed] = useState<string[]>([]);
    const [allUsers, setAllUsers] = useState<Map<string, UserDataView>>(new Map());

    // State for search
    const [searchInput, setSearchInput] = useState("");
    const [searchMatch, setSearchMatch] = useState<UserDataView | null>(null);
    const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");

    const [createProfileModalOpened, setCreateProfileModalOpened] = useState(false);


    // State for search mode
    const [searchMode, setSearchMode] = useState<SearchMode>("username");

    const searchParams = useSearchParams();
    const userParam = searchParams.get("user");

    const CONTRACT_ID = getContractId(network);

    // If the URL contains a user parameter, treat that as the focus user.
    useEffect(() => {
        if (userParam) {
            setFocusUserId(userParam);
            AddToTrustTree(userParam);
        }
    }, [userParam]);

    // Poll my user data on load (if wallet is signed in)
    useEffect(() => {
        if (!wallet) return;
        (async () => {
            if (wallet && accountId) {
                const myData: UserDataView | null = await pollMyUser(accountId, CONTRACT_ID, network);
                setMyUserData(myData);
                console.log("My user data:", myData);
                if (myData) {
                    localStorage.setItem(`nearid-${myData.hashed_user_id}`, accountId);
                } else {
                    profileButtonRef.current?.openModal();
                }
            }
        })();
    }, [wallet, accountId, CONTRACT_ID]);

    // Poll all users on load
    useEffect(() => {
        (async () => {
            try {
                const hashedIds = await pollAllUsers(CONTRACT_ID, network);
                setAllUserHashed(hashedIds);
                const usersMap = await pollUsers(CONTRACT_ID, hashedIds, network);
                setAllUsers(usersMap);
                setMessage(`Loaded ${usersMap.size} users.`);
            } catch (err) {
                console.error("Error polling all users:", err);
                setMessage("Error loading all users.");
            }
        })();
    }, [CONTRACT_ID, network]);



    // Build initial trust tree for the main user.
    useEffect(() => {
        if (myUserData) {
            // Show a loading notification during the build process.

            AddToTrustTree(myUserData.hashed_user_id)
        }
    }, [myUserData]);

    // Build the trust network recursively for a given user.
    async function AddToTrustTree(userId: string) {
        // Pass updateUser callback so that every fetched user's data gets stored in the repository.
        const newGraph = await buildTrustNetworkGraph(
            CONTRACT_ID,
            userId,
            1,
            userId === myUserData?.hashed_user_id,
            undefined,
            undefined,
            network,
            updateUser
        );

        // Optionally, fetch additional data for this user and update the repository:
        pollUsers(CONTRACT_ID, [userId], network).then((data) => {
            if (data.size > 0) {
                setAllUsers((prev) => new Map([...prev, ...data]));
            }
        });

        // Merge the new graph with the existing trust graph.
        setTrustGraph((prevGraph) => {
            console.log("Before merge:", prevGraph);
            console.log("New graph:", newGraph);
            const mergedGraph = mergeTrustNetworkGraph(prevGraph, newGraph);
            console.log("After merge:", mergedGraph);
            return { ...mergedGraph }; // Ensures a new reference
        });
    }



    // Debounced search function
    const debouncedSearch = useMemo(
        () =>
            debounce(async (input: string) => {
                // if (searchMode === "username") {
                //     // const domainSuffix = network === "mainnet" ? ".near" : ".testnet";
                //     if (input.toLowerCase().endsWith(domainSuffix)) {
                //         input = input.slice(0, -domainSuffix.length);
                //     }
                // }
                if (!input) {
                    setSearchMatch(null);
                    setSearchStatus("idle");
                    return;
                }
                setSearchStatus("loading");
                let matchedUser: UserDataView | undefined = undefined;
                if (searchMode === "username") {
                    for (const user of allUsers.values()) {
                        if (user.public_profile.toLowerCase() === input.toLowerCase()) {
                            matchedUser = user;
                            break;
                        }
                    }
                } else {
                    for (const user of allUsers.values()) {
                        if (user.hashed_user_id.toLowerCase().includes(input.toLowerCase())) {
                            matchedUser = user;
                            break;
                        }
                    }
                }
                if (!matchedUser && searchMode === "username") {
                    const cleanedInput = input.replace(/^[@# ]+|[@# ]+$/g, "");
                    const hashedInput = await hashAccountId(cleanedInput);
                    console.log("Hashed input:", hashedInput);
                    matchedUser = allUsers.get(hashedInput);
                    if (matchedUser) {
                        localStorage.setItem(`nearid-${hashedInput}`, cleanedInput);
                    }
                }
                if (matchedUser) {
                    setSearchMatch(matchedUser);
                    setSearchStatus("found");
                    setFocusUserId(matchedUser.hashed_user_id);
                    AddToTrustTree(matchedUser.hashed_user_id);
                    notifications.show({
                        title: "User Found",
                        message: `User ${matchedUser.public_profile} (${matchedUser.hashed_user_id}) found.`,
                        color: "green",
                    });
                } else {
                    setSearchMatch(null);
                    setSearchStatus("not_found");
                    notifications.show({
                        title: "No Match Found",
                        message: "No user found with the given username or hash.",
                        color: "red",
                    });
                }
            }, 500),
        [allUsers, searchMode, network]
    );

    // Handle search input change
    const handleSearchChange = (s: string) => {
        const input = s.trim();
        setSearchInput(input);
        debouncedSearch(input);
    };

    return (
        <Suspense fallback={<div>Loading...</div>}>

            <div className="">
                <div className="mx-auto p-4">
                    {/* Left: Trust Graph with Search Bar overlay */}
                    <div className="w-full relative">
                        {/* Search Bar Overlay */}
                        {wallet && accountId && !myUserData && <CreateProfileButton ref={profileButtonRef} />}

                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md bg-opacity-90 p-4 rounded shadow">
                            <Title order={3} className="text-center mb-4">
                                Search Users
                            </Title>
                            <SearchBar
                                value={searchInput}
                                onChange={handleSearchChange}
                                searchStatus={searchStatus}
                                network={network}
                                mode={searchMode}
                                onModeChange={setSearchMode}
                            />
                        </div>
                        {/* Trust Graph */}
                        <SelectedNodeContext.Provider value={{
                            selectedNodeId: focusUserId
                            , trustingSelectedNodeId: focusUserId
                                ? Array.from(users.entries())
                                    .filter(([userId, userData]) =>
                                        userData.data.trust_network?.some(([trustedId]) => trustedId === focusUserId)
                                    )
                                    .map(([userId]) => userId)
                                : []
                            , trustedBySelectedNodeId: focusUserId
                                ? (users.get(focusUserId)?.data.trust_network ?? []).map(([trustedId]) => trustedId)
                                : []

                        }}>
                            <ReactFlowProvider>
                                <TrustGraph
                                    trustNetwork={trustGraph || { nodes: {}, edges: [] }}
                                    selectedNodeId={focusUserId}
                                    callbackSelectUserId={(userId) => {
                                        setFocusUserId(userId)
                                        if (userId) fetchUser(userId, CONTRACT_ID, network).then(() => {
                                            AddToTrustTree(userId);
                                        });
                                    }
                                    }
                                />
                            </ReactFlowProvider>
                        </SelectedNodeContext.Provider>
                    </div>
                    {/* Right: Profile Card */}
                    {focusUserId && allUsers.get(focusUserId) && (
                        <div className="fixed inset-4 z-20 bg-neutral-900 border border-neutral-600 rounded shadow-lg overflow-y-auto
      lg:absolute lg:inset-auto lg:right-4 lg:top-28 lg:w-4/12"
                            style={{ maxHeight: "70vh" }}>
                            <ProfileCard
                                mainUserId={myUserData ? myUserData?.hashed_user_id || "" : ""}
                                userData={allUsers.get(focusUserId)!}
                                trustCallback={() => { }}
                                trusted={myUserData ? myUserData.trust_network?.map((relation) => {
                                    return relation[0] == focusUserId;
                                }).includes(true) || false : undefined}
                                rebuildGraphCallback={(userId) => {
                                    if (userId) fetchUser(userId, CONTRACT_ID, network).then(() => {
                                        AddToTrustTree(userId);
                                    });
                                }}
                                unselectCallback={() => setFocusUserId(null)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Suspense>

    );
}
