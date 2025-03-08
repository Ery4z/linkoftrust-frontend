import React, { useMemo, useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useSelectedNodeId } from './SelectedNodeContext';
import { useEditor } from '@tiptap/react';
import { RichTextEditor, Link } from '@mantine/tiptap';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
interface UserNodeProps {
    id: string;
    data: UserNodeData;
    isConnectable?: boolean;
}

interface UserNodeData {
    id: string;
    publicProfile: string;
    nearId?: string;
    trustCount: number;
    trustedByCount?: number;
    isMainUserNode?: boolean;
    partial?: boolean;

}

// Maintain your existing handle styles
const handleStyle = { left: 10 };

function UserNode({ data, isConnectable = true }: UserNodeProps) {
    // 1. Manage alias in local storage.
    const { selectedNodeId, trustingSelectedNodeId, trustedBySelectedNodeId } = useSelectedNodeId();
    const isSelected = data.id === selectedNodeId;
    const isTrusting = trustingSelectedNodeId.includes(data.id);
    const isTrustedBy = trustedBySelectedNodeId.includes(data.id);
    const [alias, setAlias] = useState('');
    const [userId, setUserId] = useState<string | null>(null);

    // On first render, load any previously-saved alias from local storage.
    useEffect(() => {
        
        const storedAlias = localStorage.getItem(`alias-${data.id}`);
        if (storedAlias) {
            setAlias(storedAlias);
        }
    }, [data.id,isSelected]);

    useMemo(() => {
        const storedUserId = localStorage.getItem(`nearid-${data.id}`);
        if (storedUserId) {
            setUserId(storedUserId);
        }
    }, [data.id]);

    // Save alias when user finishes editing (blur or Enter).
  

    // Determine what to show for the ID row (NEAR ID if available, otherwise fallback to hashed ID).
    const idLabel = userId ? '@' + userId : data.id;

    // 2. Create input handles based on trustedByCount.
    const inputHandles = useMemo(() => {
        return Array.from({ length: data.trustedByCount || 0 }, (_, i) => (
            <Handle
                key={`input-${i}`}
                className='customHandle'
                type="target"
                position={Position.Top}
                isConnectable={false}
            />
        ));
    }, [data.trustedByCount]);

    // 3. Create output handles based on trustCount.
    const outputHandles = useMemo(() => {
        return Array.from({ length: data.trustCount }, (_, i) => (
            <Handle
                key={`output-${i}`}
                className='customHandle'
                type="source"
                position={Position.Bottom}
                isConnectable={false}
            />
        ));
    }, [data.trustCount]);

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
        content: data.publicProfile,

        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-sm focus:outline-none',
            },
        },
    });
    useEffect(() => {
        if (!editor) return
        editor.commands.setContent(data.publicProfile);
        editor.setEditable(false);
    }
        , [data.publicProfile, editor]);

        const borderStyle = '2px' + (data.partial ? ' dashed' : ' solid') + (isTrustedBy ? '#96daf4' : isTrusting ? '#dd6e42' : data.isMainUserNode ? '#ffffff' : isSelected ? '#e8dab2' : 'transparent');
    // Base style for the node container.
    const containerStyle: React.CSSProperties = {
        minWidth: 200,
        minHeight: 100,
        borderRadius: 6,
        padding: 8,
        position: 'relative',
        fontFamily: 'sans-serif',
        backgroundColor: '#222',
        border: borderStyle,
        animation: isSelected ? 'pulse-selected 2s infinite' : 'none',
    };




    // If this is the main user node, add glowing & pulsing styles.
    const mainUserStyle: React.CSSProperties = (data.isMainUserNode && (selectedNodeId === null))
        ? {
            animation: 'pulse-main 2s infinite',
        }
        : {};

    const partialStyle: React.CSSProperties = data.partial
        ? {
            opacity: 0.8,
        }
        : {};

    const trustedStyle: React.CSSProperties = isTrustedBy
        ? {
            animation: 'pulse-trusted 2s infinite',
        }
        : {};
    const trustingStyle: React.CSSProperties = isTrusting
        ? {
            animation: 'pulse-trusting 2s infinite',
        }
        : {};

    // Merge the two style objects.
    const mergedStyle = { ...containerStyle, ...mainUserStyle, ...partialStyle, ...trustedStyle, ...trustingStyle };

    return (
        <>
            {/* Define the keyframes for the pulse animation */}
            <style>
                {`
          @keyframes pulse-main {
            0% {
              box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
            }
          }
            @keyframes pulse-selected {
            0% {
              box-shadow: 0 0 0 0 rgba(232, 218, 178, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(232, 218, 178, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(232, 218, 178, 0);
                }}

            @keyframes pulse-trusted {
            0% {
              box-shadow: 0 0 0 0 rgba(150, 218, 244, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(150, 218, 244, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(150, 218, 244, 0);
                }}

            @keyframes pulse-trusting {
            0% {
              box-shadow: 0 0 0 0 rgba(221, 110, 66, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(221, 110, 66, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(221, 110, 66, 0);
            }
          }
        `}
            </style>

            <div style={mergedStyle}>
                {/* Render input handles if there are any */}
                {(data.trustedByCount || 0) > 0 && inputHandles}

                {/* Top row: Alias / ID / Edit button */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                    }}
                >
                    {/* Left side: either an <input> or the saved alias in bold, plus NEAR/ID in italic. */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                       
                            <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>
                                {alias || 'No Alias'}
                            </span>
                        <span style={{ fontStyle: 'italic', color: '#ccc' }}>
                            {idLabel}
                        </span>
                    </div>

                    
                </div>

                {/* Public Profile */}
                <div style={{ marginBottom: 4 }}>
                    <RichTextEditor editor={editor} withTypographyStyles={false}>
                        <RichTextEditor.Content />
                    </RichTextEditor>
                </div>

                {/* Render output handles */}
                {outputHandles}
            </div>
        </>
    );
}

export default UserNode;
