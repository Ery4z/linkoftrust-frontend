"use client";

import React, { useContext } from "react";
import { BaseEdge, EdgeProps, getSmoothStepPath, MarkerType } from "@xyflow/react";
import { SelectedNodeContext } from "./SelectedNodeContext";

export default function ColoredEdge(props: EdgeProps) {
    const { id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;
    const [edgePath, _, __] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // You can also read from your context if needed:
    const { selectedNodeId } = useContext(SelectedNodeContext);

    // Default style (fallback)
    let strokeColor = "#555";
    let strokeWidth = 2;

    // If this edge’s target = selected node => e.g. show orange
    if (target === selectedNodeId) {
        strokeColor = "#DD6E42"; // trusting color
        strokeWidth = 3;
    }
    // If this edge’s source = selected node => e.g. show blue
    else if (source === selectedNodeId) {
        strokeColor = "#96daf4"; // trusted color
        strokeWidth = 3;
    }

    const animation = (target === selectedNodeId || source === selectedNodeId) && (
        <circle r="5" fill={strokeColor}>
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
    )
    const markerEnd = { type: MarkerType.ArrowClosed, width: 20, height: 20, color: strokeColor };
    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                style={{ stroke: strokeColor, strokeWidth }}
                markerEnd={markerEnd as any}
            // markerStart={markerStart}
            // markerEnd={type:MarkerType.ArrowClosed}
            // We'll define this in the SVG below
            />
            {animation}
            {/* You could add an animated circle or other decorations if desired */}
        </>
    );
}
