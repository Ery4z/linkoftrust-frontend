import { WalletConnection } from "near-api-js";
import { getUserData, UserDataView } from "./contractData";
import { stringify } from "querystring";

/**
 * Interface for a node in the trust network.
 */
export interface TrustNode {
  id: string;          // Hashed user id (base58)
  publicProfile: string;
    isMainUserNode?: boolean;
    isSelected?: boolean;
    partial?: boolean;
  // Although we include children here (to re-use the structure) in the node data,
  // the overall graph is a flattened structure.
  children: TrustNode[];
}

/**
 * Interface representing the complete trust network as a graph.
 */
export interface TrustNetworkGraph {
  // A mapping of node id to its TrustNode.
  nodes: { [id: string]: TrustNode };
  // An array of edges represented as a tuple [sourceNodeId, targetNodeId].
  edges: Array<[string, string]>;
}

/**
 * Recursively builds the trust network graph up to a maximum depth.
 * 
 * This function now accepts an optional callback (updateUserCallback) which is used to update
 * a central repository (or state) of user data. Additionally, nodes that are not fully polled
 * (because maxDepth reached 0) are marked with the flag `partial`.
 *
 * @param contractId - The contract's account id.
 * @param userId - The base58 hashed user id to start from.
 * @param maxDepth - Maximum recursion depth.
 * @param isMainUserNode - If true, marks this node as the main user.
 * @param graph - (Internal) Graph that accumulates nodes and edges.
 * @param visited - (Internal) A Set used to avoid processing the same user twice.
 * @param network - "testnet" or "mainnet".
 * @param updateUserCallback - (Optional) A callback to update the user repository.
 * @returns A Promise resolving to a TrustNetworkGraph object.
 */
export async function buildTrustNetworkGraph(
    contractId: string,
    userId: string,
    maxDepth: number,
    isMainUserNode: boolean = false,
    graph: TrustNetworkGraph = { nodes: {}, edges: [] },
    visited: Set<string> = new Set(),
    network: "testnet" | "mainnet" = "testnet",
    updateUserCallback?: (hashedUserId: string, data: UserDataView, fullyFetched: boolean) => void
  ): Promise<TrustNetworkGraph> {
    // Base case: stop if depth is negative or user already visited.
    if (maxDepth < 0 || visited.has(userId)) return graph;
    visited.add(userId);
  
    // Fetch user data
    const userData: UserDataView | null = await getUserData(contractId, userId, network);
    if (!userData) return graph;
  
    // Determine if this node is fully fetched.
    const fullyFetched = maxDepth > 0;
    // Optionally update the repository with this user's data.
    if (updateUserCallback) {
      updateUserCallback(userData.hashed_user_id, userData, fullyFetched);
    }
  
    // Create the node, marking it as partial if maxDepth reached 0.
    const node: TrustNode = {
      id: userData.hashed_user_id,
      publicProfile: userData.public_profile,
      children: [],
      isMainUserNode: isMainUserNode,
      partial: maxDepth === 0,
    };
  
    // Add the node to the graph.
    graph.nodes[userData.hashed_user_id] = node;
  
    // If there is a trust network and we can go deeper:
    if (userData.trust_network && maxDepth > 0) {
      for (const [trustedId, trustLevel] of userData.trust_network) {
        // Only include trusted users with positive trust level.
        if (trustLevel <= 0) continue;
  
        // Record the edge.
        graph.edges.push([userData.hashed_user_id, trustedId]);
        // Recursively build for the trusted user.
        await buildTrustNetworkGraph(contractId, trustedId, maxDepth - 1, false, graph, visited, network, updateUserCallback);
        // Add as child if present.
        const childNode = graph.nodes[trustedId];
        if (childNode) {
          node.children.push(childNode);
        }
      }
    }
  
    return graph;
  }
  
  /**
   * Merges two trust network graphs.
   * 
   * For nodes present in both graphs, merges their children (removing duplicates) and flags the node as selected
   * if its id matches the provided selectedUserId.
   *
   * @param graph1 - The original graph.
   * @param graph2 - The new graph to merge.
   * @param selectedUserId - (Optional) The user id that should be marked as selected.
   * @returns A merged TrustNetworkGraph.
   */
  export function mergeTrustNetworkGraph(
    graph1: TrustNetworkGraph | undefined | null,
    graph2: TrustNetworkGraph,
    selectedUserId?: string
  ): TrustNetworkGraph {
    if (!graph1) {
      if (selectedUserId && graph2.nodes[selectedUserId]) {
        graph2.nodes[selectedUserId].isSelected = true;
      }
      return graph2;
    }
  
    const mergedNodes: { [id: string]: TrustNode } = { ...graph1.nodes };
  
    for (const id in graph2.nodes) {
      if (mergedNodes[id]) {
        const node1 = mergedNodes[id];
        const node2 = graph2.nodes[id];
        const childrenMap: { [childId: string]: TrustNode } = {};
        
          if (!node2.partial) {
              for (const child of node2.children) {
                childrenMap[child.id] = child;
              }
            
          } else {
              
              for (const child of node1.children) {
                childrenMap[child.id] = child;
              }
        }
  
        mergedNodes[id] = {
          id: node1.id,
          publicProfile: node2.publicProfile,
          children: Object.values(childrenMap),
          isMainUserNode: node2.isMainUserNode,
          isSelected: (node2.isSelected) || (selectedUserId === id),
          partial: node1.partial && node2.partial, // if both are partial, then mark as partial
        };
      } else {
        const node = graph2.nodes[id];
        if (selectedUserId === id) {
          node.isSelected = true;
        }
        mergedNodes[id] = node;
      }
    }
  
    // Merge edges without duplicates.
    const mergedEdges = [...graph2.edges];
      for (const edge of graph1.edges) {
        // Edge Unicity
        if (!mergedEdges.some(([s, t]) => s === edge[0] && t === edge[1])) { 
            
            //Verification if if in graph2 there is not node s otherwise it means that teh edge got deleted
            let spotted = false;
            for (const node in graph2.nodes) {
                if (node === edge[0] && (!graph2.nodes[node].partial)) {
                    spotted = true;
                    break;
                }
            }
            if (!spotted) {
                mergedEdges.push(edge);
            }


        }
      }
      
  
    if (selectedUserId && mergedNodes[selectedUserId]) {
      mergedNodes[selectedUserId].isSelected = true;
    }
  
    return { ...graph1, nodes: { ...mergedNodes }, edges: [...mergedEdges] };
  }