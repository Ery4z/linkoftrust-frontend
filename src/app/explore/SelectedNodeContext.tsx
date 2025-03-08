import { createContext, useContext } from 'react';

interface SelectedNodeContextValue {
  selectedNodeId: string | null;
  trustingSelectedNodeId: string[];
  trustedBySelectedNodeId: string[];
}

export const SelectedNodeContext = createContext<SelectedNodeContextValue>({ selectedNodeId: null, trustingSelectedNodeId: [], trustedBySelectedNodeId: [] });

export const useSelectedNodeId = () => useContext(SelectedNodeContext);
