import { TrustNetworkGraph } from '@/lib/trustNetwork';
import {
    ReactFlow,
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    MiniMap,
    useReactFlow,
    MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import UserNode from './UserNode';
import "./xy-theme.css";
import ColoredEdge from "./ColoredEdge";

interface TrustGraphProps {
    trustNetwork: TrustNetworkGraph;
    selectedNodeId?: string | null;
    callbackSelectUserId: (userId: string | null) => void;
}
const edgeTypes = {
  coloredEdge: ColoredEdge,
};

const nodeTypes = {
    userNode: UserNode,
};

function TrustGraph({ trustNetwork, selectedNodeId, callbackSelectUserId }: TrustGraphProps) {
    const [nodes, setNodes] = useState<any[]>([]);
    const [edges, setEdges] = useState<any[]>([]);
    const reactFlowInstance = useReactFlow();

    // Build nodes and edges from the trustNetwork graph.
    useMemo(() => {
        if (!trustNetwork) return;
        let n_nodes = [];
        let i = 0;
        for (let key in trustNetwork.nodes) {
            const node = trustNetwork.nodes[key];
            const nearId = localStorage.getItem(`nearid-${node.id}`);
            const storedPosition = localStorage.getItem(`position-${node.id}`)
                ? JSON.parse(localStorage.getItem(`position-${node.id}`) || "{}")
                : null;

            n_nodes.push({
                id: node.id,
                type: 'userNode',
                nearId: nearId,
                position: storedPosition || { x: i * 100, y: i * 100 },
                data: {
                    id: node.id,
                    publicProfile: node.publicProfile,
                    trustCount: node.children.length,
                    trustedByCount: trustNetwork.edges.filter(([source, target]) => target === node.id).length,
                    isMainUserNode: node.isMainUserNode || false,
                    selected: false, // initial selected state
                    partial: node.partial,

                },
            });
            i += 1;
        }
        setNodes(n_nodes);
        setEdges(
            trustNetwork.edges.map(([source, target]) => ({
              id: `${source}-${target}`,
              source,
              target,
              type: "coloredEdge",
              markerEnd:{type: MarkerType.ArrowClosed, width:20, height:20}
            }))
          );
    }, [trustNetwork]);

    // Update node selection by updating the data.selected property.
    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    selected: node.id === selectedNodeId,
                },
            }))
        );
    }, [selectedNodeId]);

    const onNodesChange = useCallback(
        (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );
    const onEdgesChange = useCallback(
        (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    return (
        <div style={{ height: '80vh' }}>
            <ReactFlow
                fitView
                elementsSelectable={true}
                onNodeClick={(event, node) => {
                    callbackSelectUserId(node.data!.id!);
                }}
                // Clear selection when clicking on the canvas.
                onPaneClick={() => callbackSelectUserId(null)}
                onNodeDragStop={(event, node) => {
                    localStorage.setItem(`position-${node.id}`, JSON.stringify(node.position));
                }}
                colorMode="dark"
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
            >
                <Background />
                <MiniMap />
                <Controls />
                
            </ReactFlow>
        </div>
    );
}

export default TrustGraph;
