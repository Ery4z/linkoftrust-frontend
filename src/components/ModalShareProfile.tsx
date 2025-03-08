// src/components/ModalShareProfile.tsx
"use client";

import React, { useState } from "react";
import { Modal, TextInput, Button, Group, Text } from "@mantine/core";

// Ensure you set NEXT_PUBLIC_SITE_URL in your environment.
// For example, in a Next.js project you could have .env.local with:
// NEXT_PUBLIC_SITE_URL=https://yourdomain.com

export default function ModalShareProfile({
  opened,
  onClose,
  userHash,
}: {
  opened: boolean;
  onClose: () => void;
  userHash: string; // Hashed b58 of a user
}) {
  // Read the base URL from the environment variable
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";
  const shareUrl = `${baseUrl}/explore?user=${userHash}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy the link", error);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Share Profile"
      centered
      size="sm"
      overlayProps={{ blur: 3, opacity: 0.55 }}
      transitionProps={{ transition: "fade", duration: 300 }}
    >
      <Text mb="sm">
        Copy and share this link to let others view this profile:
      </Text>
      <TextInput value={shareUrl} readOnly variant="filled" mb="md" />
      <Group px="right">
        <Button onClick={handleCopy} variant="outline">
          {copied ? "Copied!" : "Copy Link"}
        </Button>
      </Group>
    </Modal>
  );
}
