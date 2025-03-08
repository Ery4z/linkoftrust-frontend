import React, { useState, useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import { RichTextEditor, Link } from '@mantine/tiptap';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import ModalValidateProfileUpdate from './ModalValidateProfileUpdate';
import { useWallet } from '@/context/WalletContext';
import { notifications } from '@mantine/notifications';
import { modifyPublicProfile, pollMyUser, trustAction, untrustAction } from '@/lib/contractData';
import { useGasPrice } from '@/context/GasPriceContext';
import ModalValidateTrust from './ModalValidateTrust';
import ModalValidateUntrust from './ModalValidateUntrust';
import { FinalExecutionStatusBasic } from 'near-api-js/lib/providers';
import { useUserRepository } from '@/context/UserRepositoryContext';
import { ActionIcon, CloseButton, TextInput, Tooltip } from '@mantine/core';
import { IconLink, IconTag, IconTagPlus } from '@tabler/icons-react';
import { IconProgressCheck } from '@tabler/icons-react';
import { IconTagOff } from '@tabler/icons-react';
import ModalShareProfile from '@/components/ModalShareProfile';
interface ProfileCardProps {
    userData: {
        hashed_user_id: string;
        public_profile: string;
    };
    mainUserId: string; // The main user's hashed id is provided as a prop
    trustCallback?: (userId: string, trust: boolean) => void;
    trusted?: boolean,
    rebuildGraphCallback: (userId: string) => void;
    unselectCallback?: () => void;
}

export function ProfileCard({ userData, mainUserId, trustCallback, rebuildGraphCallback, trusted, unselectCallback }: ProfileCardProps) {
    const { wallet, accountId, network, userBalance } = useWallet();
    const { gasPrice } = useGasPrice();
    const { fetchUser, users } = useUserRepository();
    const CONTRACT_ID = network === "testnet" ? "linkoftrust.testnet" : "linkoftrust.near";
    const { hashed_user_id, public_profile } = userData;
    const [alias, setAlias] = useState<string | null>(null);
    const [isEditingAlias, setIsEditingAlias] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [modalUserUpdateOpened, setModalUserUpdateOpened] = useState(false);
    const [modalUserTrustOpened, setModalUserTrustOpened] = useState(false);
    const [modalUserUntrustOpened, setModalUserUntrustOpened] = useState(false);
    const [modalShareProfileOpened, setModalShareProfileOpened] = useState(false);

    // Determine if this profile is the main profile
    const [isMainProfile, setIsMainProfile] = useState(false);

    // Trust state for non-main profiles.
    const [isTrusted, setIsTrusted] = useState(false);

    useEffect(
        () => {
            setIsTrusted(
                users.get(mainUserId)?.data.trust_network?.find(([trustedId, trustLevel]) => trustedId === hashed_user_id) !== undefined
            )
        }, [users, mainUserId, hashed_user_id]
    )

    // States to track editor content.
    const [currentContent, setCurrentContent] = useState(public_profile);
    const [previousContent, setPreviousContent] = useState(public_profile);

    // Load alias and NEAR user id from localStorage.
    useEffect(() => {
        const storedAlias = localStorage.getItem(`alias-${hashed_user_id}`);
        setAlias(storedAlias || null);
    }, [hashed_user_id]);

    useEffect(() => {
        const nearId = localStorage.getItem(`nearid-${hashed_user_id}`);
        setUserId(nearId || null);
    }, [hashed_user_id]);

    // Determine if this is the main profile using the passed mainUserId prop.
    useEffect(() => {
        setIsMainProfile(hashed_user_id === mainUserId);
    }, [hashed_user_id, mainUserId]);

    const handleAliasBlur = () => {
        if (!alias) return;
        localStorage.setItem(`alias-${hashed_user_id}`, alias);
        setIsEditingAlias(false);
    };

    const resetAlias = () => {
        setAlias(null);
        setIsEditingAlias(false);
        localStorage.removeItem(`alias-${hashed_user_id}`);
    };

    // Initialize Tiptap editor.
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link,
            Superscript,
            SubScript,
            Highlight,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
        content: public_profile,
        onUpdate: ({ editor }) => {
            if (isMainProfile) {
                setCurrentContent(editor.getHTML());
            }
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-sm m-5 focus:outline-none',
            },
        },
    });

    // Set editor's editable mode based on profile type.
    useEffect(() => {
        if (editor) {
            editor.setEditable(isMainProfile);
        }
    }, [editor, isMainProfile]);

    // When public_profile changes externally, update editor content and state.
    useEffect(() => {
        if (editor) {
            editor.commands.setContent(public_profile);
            setCurrentContent(public_profile);
            setPreviousContent(public_profile);
        }
    }, [public_profile, editor]);

    // Handler for the action button.
    const handleActionButton = () => {
        if (isMainProfile) {
            // "Update" behavior: update the previous content state.
            const newContent = editor?.getHTML() || "";
            console.log("Update clicked. Previous content:", previousContent);
            console.log("New content:", newContent);
            setPreviousContent(newContent);
            setModalUserUpdateOpened(true);
            // (Here you would normally trigger an update API call.)
        } else {
            // For non-main profiles: toggle trust state.
            isTrusted ? setModalUserUntrustOpened(true) : setModalUserTrustOpened(true);
        }
    };

    async function setPublicProfileUpdate(maxDeposit: number, maxGas: number) {
        console.log("Updating public profile...");
        console.log("Max deposit:", maxDeposit);
        console.log("Max gas:", maxGas);
        if (!wallet || !accountId) {
            notifications.show({
                title: 'Error',
                message: 'Wallet not initialized.',
                color: 'red',
            });
            return;
        }
        if (!gasPrice) {
            notifications.show({
                title: 'Error',
                message: 'Gas price not available.',
                color: 'red',
            });
            return;
        }
        const outcome = await modifyPublicProfile(wallet, CONTRACT_ID, currentContent, maxGas, maxDeposit);
        console.log(outcome);
        await fetchUser(mainUserId, CONTRACT_ID, network);
        rebuildGraphCallback(mainUserId);
        setModalUserUpdateOpened(false);

        notifications.show({
            title: 'Profile Updated',
            message: 'Your public profile has been updated.',
            color: 'green',
        });
    }

    async function handleTrust(maxDeposit: number, maxGas: number) {
        if (!wallet) {
            notifications.show({
                title: 'Please Sign In',
                message: 'You must be signed in to trust a user.',
                color: 'red',
            });
            return;
        }
        if (!gasPrice) {
            notifications.show({
                title: 'Error',
                message: 'Gas price not available.',
                color: 'red',
            });
            return;
        }

        try {
            // Call the `trust` method on the contract
            const outcome = await trustAction(wallet, CONTRACT_ID, hashed_user_id, 1.0, maxGas, maxDeposit);
            await fetchUser(mainUserId, CONTRACT_ID, network);
            rebuildGraphCallback(mainUserId);
            setModalUserTrustOpened(false);

            console.log("Trust transaction outcome:", outcome);
            notifications.show({
                title: 'User Trusted',
                message: 'You have successfully trusted the user.',
                color: 'green',
            });
        } catch (err) {
            console.error("Error trusting user:", err);
            notifications.show({
                title: 'Error',
                message: 'Error trusting user.',
                color: 'red',
            });
        }
    }

    async function handleUntrust(maxDeposit: number, maxGas: number) {

        if (!wallet) {
            notifications.show({
                title: 'Please Sign In',
                message: 'You must be signed in to untrust a user.',
                color: 'red',
            });
            return;
        }
        if (!gasPrice) {
            notifications.show({
                title: 'Error',
                message: 'Gas price not available.',
                color: 'red',
            });
            return;
        }

        try {
            // Call the `trust` method on the contract
            const outcome = await untrustAction(wallet, CONTRACT_ID, hashed_user_id, maxGas, maxDeposit);
            await fetchUser(mainUserId, CONTRACT_ID, network);
            rebuildGraphCallback(mainUserId);
            setModalUserUntrustOpened(false);

            console.log("Untrust transaction outcome:", outcome);
            notifications.show({
                title: 'User Untrusted',
                message: 'You have successfully untrusted the user.',
                color: 'green',
            });
        } catch (err) {
            console.error("Error untrusting user:", err);
            notifications.show({
                title: 'Error',
                message: 'Error untrusting user.',
                color: 'red',
            });
        }
    }


    // Determine the label for the action button.
    const actionButtonLabel = isMainProfile ? "Update" : (isTrusted ? "Untrust" : "Trust");

    return (
        <div className="w-full bg-neutral-900 shadow-md p-5 text-white font-sans">
            {/* Header: Alias, User ID, and Action Button */}
            <div className="flex items-center mb-5 justify-between">
                <div className="flex-grow">
                    <div className="flex items-center">

                        {isEditingAlias ? (
                            <>
                                <TextInput
                                    autoFocus
                                    value={alias || ''}
                                    onChange={(e) => setAlias(e.target.value)}
                                    onBlur={handleAliasBlur}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAliasBlur();
                                    }}
                                    placeholder="Enter alias"
                                />
                                <Tooltip label="Save Alias" position="right">
                                    <ActionIcon
                                        onClick={() => setIsEditingAlias(false)}
                                        className="ml-2 mb-1"
                                        variant="subtle" color="gray" size="md">
                                        <IconProgressCheck size="sm" />

                                    </ActionIcon>
                                </Tooltip>
                                
                            </>
                        ) : (
                            <>
                                <h2 className={`${(!alias && !userId) ? "text-md" : "text-2xl"} font-bold m-0 truncate`}>
                                    {alias || (userId ? '@' + userId : '#'+hashed_user_id)}
                                </h2>
                                <Tooltip label="Edit local alias this will be displayed only on this device" position="right">
                                    <ActionIcon
                                        onClick={() => setIsEditingAlias(true)}
                                        className="ml-2 mb-1"
                                        variant="subtle" color="gray" size="md">
                                        <IconTagPlus size="sm" />

                                    </ActionIcon>
                                </Tooltip>
                            </>

                        )}
                        {alias && 
                    <Tooltip label="Delete Alias" position="right">
                                    <ActionIcon
                                        onClick={resetAlias}
                                        className="ml-2 mb-1"
                                        variant="subtle" color="gray" size="md">
                                        <IconTagOff size="sm" />

                                    </ActionIcon>
                                </Tooltip>
}

                    </div>
                    <p className="m-0 text-sm text-gray-400 truncate max-w-64 sm:max-w-96 lg:max-w-64 xl:max-w-96">
                        {alias ? (userId ? '@' + userId : hashed_user_id) : (userId ? '#'+hashed_user_id : '')}
                    </p>

                </div>
                <div className="flex space-x-2">
                    <Tooltip label="Share Profile" position="right">
                        <ActionIcon
                            onClick={() => setModalShareProfileOpened(true)}
                            variant="subtle" color="gray" size="md">
                            <IconLink size="sm" />
                        </ActionIcon>
                    </Tooltip>
                    <CloseButton size="lg" onClick={
                        () => {
                            if (unselectCallback) {
                                unselectCallback();
                            }
                        }
                    } />


                </div>
            </div>

            {/* Public Profile Content */}
            <div className="border-t border-gray-600 pt-5">
                <h3 className="text-xl mb-2">About</h3>
                {isMainProfile ? (
                    // Editable with toolbar for the main profile.
                    <RichTextEditor editor={editor} withTypographyStyles={false}>
                        <RichTextEditor.Toolbar sticky stickyOffset={60}>
                            <RichTextEditor.ControlsGroup>
                                <RichTextEditor.Bold />
                                <RichTextEditor.Italic />
                                <RichTextEditor.Underline />
                                <RichTextEditor.Strikethrough />
                                <RichTextEditor.ClearFormatting />
                            </RichTextEditor.ControlsGroup>
                            <RichTextEditor.ControlsGroup>
                                <RichTextEditor.H1 />
                                <RichTextEditor.H2 />
                                <RichTextEditor.H3 />
                            </RichTextEditor.ControlsGroup>
                            <RichTextEditor.ControlsGroup>
                                <RichTextEditor.Blockquote />
                                <RichTextEditor.Hr />
                                <RichTextEditor.BulletList />
                                <RichTextEditor.OrderedList />
                                <RichTextEditor.Subscript />
                                <RichTextEditor.Superscript />
                            </RichTextEditor.ControlsGroup>
                            <RichTextEditor.ControlsGroup>
                                <RichTextEditor.Link />
                                <RichTextEditor.Unlink />
                            </RichTextEditor.ControlsGroup>
                            <RichTextEditor.ControlsGroup>
                                <RichTextEditor.AlignLeft />
                                <RichTextEditor.AlignCenter />
                                <RichTextEditor.AlignJustify />
                                <RichTextEditor.AlignRight />
                            </RichTextEditor.ControlsGroup>
                            <RichTextEditor.ControlsGroup>
                                <RichTextEditor.Undo />
                                <RichTextEditor.Redo />
                            </RichTextEditor.ControlsGroup>
                        </RichTextEditor.Toolbar>
                        <RichTextEditor.Content />
                    </RichTextEditor>
                ) : (
                    // Read-only view for non-main profiles.
                    <div className="prose prose-invert prose-sm m-5">
                        <div dangerouslySetInnerHTML={{ __html: public_profile }} />
                    </div>
                )}
            </div>
            <div className="flex justify-end mt-5">
                {wallet?.getAccounts() !== undefined && (
                    <button
                        onClick={handleActionButton}
                        className="bg-blue-600 px-4 py-2 text-white font-semibold transition duration-150 hover:bg-blue-700"
                    >
                        {actionButtonLabel}
                    </button>)}
            </div>
            <ModalValidateProfileUpdate
                opened={modalUserUpdateOpened}
                onClose={() => setModalUserUpdateOpened(false)}
                previousProfile={userData.public_profile} // your stored previous profile
                newProfile={currentContent} // new content from editor
                userBalance={userBalance} // e.g., retrieved from wallet balance
                onConfirm={setPublicProfileUpdate}
            />
            <ModalValidateTrust
                opened={modalUserTrustOpened}
                onClose={() => setModalUserTrustOpened(false)}
                userBalance={userBalance} // e.g., retrieved from wallet balance
                onConfirm={handleTrust}
                userId={hashed_user_id}
            />
            <ModalValidateUntrust
                opened={modalUserUntrustOpened}
                onClose={() => setModalUserUntrustOpened(false)}
                userBalance={userBalance} // e.g., retrieved from wallet balance
                onConfirm={handleUntrust}
                userId={hashed_user_id}
            />
            <ModalShareProfile
                opened={modalShareProfileOpened}
                onClose={() => setModalShareProfileOpened(false)}
                userHash={hashed_user_id}
            />

        </div>
    );
}
