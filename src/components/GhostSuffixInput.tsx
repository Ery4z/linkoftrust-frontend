// src/components/GhostSuffixInput.tsx
"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { TextInput, TextInputProps, Box, Text } from "@mantine/core";

interface GhostSuffixInputProps extends TextInputProps {
  ghostSuffix: string;
}

export function GhostSuffixInput({
  ghostSuffix,
  value,
  onChange,
  ...others
}: GhostSuffixInputProps) {
  const measureRef = useRef<HTMLParagraphElement>(null);
  const [textWidth, setTextWidth] = useState<number>(0);
  const [userInput, setUserInput ] = useState<string>("");
  const [remaningGhost, setRemainingGhost] = useState<string>(ghostSuffix);

  // Measure the width of the user input.
  useEffect(() => {
    if (measureRef.current) {
      setTextWidth(measureRef.current.offsetWidth);
    }
  }, [value]);

  // Compute the remaining ghost text based on overlap.
  const remainingGhost = useMemo(() => {
    if (!userInput || typeof userInput !== "string") return "";
    let overlap = 0;

    //Check if first character of ghostSuffix is in value (if multiple takes the last one)
    if (userInput.toLowerCase().slice(
      Math.max(userInput.length-ghostSuffix.length,0)
    ).includes(ghostSuffix[0].toLowerCase())) {
      const startCehckIndex = userInput.toLowerCase().lastIndexOf(ghostSuffix[0].toLowerCase());
      const valueSuffix = userInput.slice(startCehckIndex);

      for (let i = 0; (i < ghostSuffix.length) && (i < valueSuffix.length) ; i++) {
        if (valueSuffix[i].toLowerCase() === ghostSuffix[i].toLowerCase()) {
          overlap++;
        } else {
          break;
        }
      }
      return ghostSuffix.slice(overlap);
    }
    return ghostSuffix;
    
  }, [userInput, ghostSuffix]);
  

 

  // Custom change handler that creates a synthetic event with the appended ghost text.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setUserInput(inputValue);
    const newValue = inputValue + remainingGhost;
    // Create a shallow copy of the event with a modified target value.
    const syntheticEvent = {
      ...e,
      target: { ...e.target, value: newValue },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange && onChange(syntheticEvent);
  };

  return (
    <Box style={{ position: "relative", width: "100%", fontSize: "1rem", fontFamily: "inherit" }}>
      {/* Hidden text element to measure user input width */}
      <Text
        ref={measureRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "pre",
          fontSize: "inherit",
          fontFamily: "inherit",
          padding: "8px 0", // Adjust to match the input's inner padding
        }}
      >
        {userInput}
      </Text>

      {/* Ghost suffix placed exactly after the measured text */}
      {userInput && (
        <Text
          style={{
            position: "absolute",
            left: textWidth +13,// Account for the left padding of the input.
            top: 0,
            pointerEvents: "none",
            color: "#666666",
            whiteSpace: "nowrap",
            fontSize: "inherit",
            fontFamily: "inherit",
            lineHeight: "normal",
            padding: "8px 0",
          }}
        >
          {remainingGhost}
        </Text>
      )}

      {/* The actual input */}
      <TextInput
        value={userInput}
        onChange={handleChange}
        {...others}
        styles={{
          input: {
            backgroundColor: "transparent",
            fontSize: "1rem",
            fontFamily: "inherit",
          },
        }}
      />
    </Box>
  );
}
