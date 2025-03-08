// src/components/SearchBar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { TextInput, Select, Box, Text } from "@mantine/core";
import { GhostSuffixInput } from "./GhostSuffixInput";
import { IconAt, IconHash } from "@tabler/icons-react";

export type SearchMode = "username" | "hash";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  searchStatus: "idle" | "loading" | "found" | "not_found";
  network: "mainnet" | "testnet";
  mode?: SearchMode;
  onModeChange?: (mode: SearchMode) => void;
}

export function SearchBar({
  value,
  onChange,
  searchStatus,
  network,
  mode: initialMode = "username",
  onModeChange,
}: SearchBarProps) {
  const [mode, setMode] = useState<SearchMode>(initialMode);

  useEffect(() => {
    onModeChange && onModeChange(mode);
  }, [mode, onModeChange]);

  const ghostSuffix = network === "mainnet" ? ".near" : ".testnet";

  return (
    <Box style={{ position: "relative", width: "100%" }}>
      {/* Mode selector container */}
      <Box style={{ position: "absolute", left: 0, top: 0, height: "100%", zIndex: 1 }}>
        <Select
          data={[
            { value: "username", label: "@ - Search by NEAR Username" },
            { value: "hash", label: "# - Search by b58 Hash" },
          ]}
          value={mode}
          onChange={(val) => {
            if (val === "username" || val === "hash") {
              setMode(val);
            }
          }}
          comboboxProps={{ width: 300, position: 'bottom-start' }}
          size="sm"
          variant="default"
          rightSection={<></>} // Remove the chevron icon
          styles={{
            input: {
              width: 1, // Fixed width so that only a symbol is visible when closed
              color: "transparent", // Hide the actual text
              // border: "none",
              background: "transparent",
              paddingLeft: 8,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              zIndex: 1,
            },
          }}
        />
        {/* Overlay showing the symbol when closed */}
        <Box

          style={{
            position: "absolute",
            left: 11,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            fontSize: "0.875rem",
            lineHeight: "1",
          }}
        >
          {mode === "username" ? <IconAt stroke={1.5}/> : <IconHash stroke={1.5}/>}
        </Box>
      </Box>
      {/* Input field offset by the mode selector */}
      <Box style={{ marginLeft: 60, zIndex: 10 }}>
        {mode === "username" ? (
          <GhostSuffixInput
            ghostSuffix={ghostSuffix}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter NEAR username"
          />
        ) : (
          <TextInput
            placeholder="Enter base58 hash"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            styles={{
              input: {
                backgroundColor: "transparent",
                fontSize: "1rem",
                fontFamily: "inherit",
              },
            }}
          />
        )}
      </Box>
      {/* Loading indicator */}
      {searchStatus === "loading" && (
        <Text
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
          }}
          size="sm"
        >
          Searching...
        </Text>
      )}
    </Box>
  );
}
