// src/lib/near.ts

import { connect, keyStores, WalletConnection, Near, ConnectConfig } from 'near-api-js';

/**
 * Returns a NEAR ConnectConfig for the selected network.
 * @param network "testnet" or "mainnet"
 */
export const getNearConfig = (network: 'testnet' | 'mainnet' = 'testnet'): ConnectConfig => {
  if (network === 'mainnet') {
    // MainNet config
    return {
      networkId: 'mainnet',
      nodeUrl: 'https://rpc.mainnet.near.org',
      walletUrl: 'https://wallet.meteorwallet.app',
      helperUrl: 'https://helper.mainnet.near.org',
      keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      headers: {},
    };
  } else {
    // TestNet config
    return {
      networkId: 'testnet',
      nodeUrl: 'https://rpc.testnet.near.org',
      walletUrl: 'https://testnet.mynearwallet.com',
      helperUrl: 'https://helper.testnet.near.org',
      keyStore: new keyStores.BrowserLocalStorageKeyStore(),
      headers: {},
    };
  }
};

/**
 * Creates a NEAR object using a config for the selected network.
 */
export async function initNear(
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<Near> {
  const config = getNearConfig(network);
  return connect(config);
}

/**
 * Creates a NEAR WalletConnection object, storing data in localStorage under key `appName`.
 * @returns near + wallet object
 */
export async function initWalletConnection(
  network: 'testnet' | 'mainnet' = 'testnet',
  appName = 'linkoftrust'
) {
  const near = await initNear(network);
  const wallet = new WalletConnection(near, appName);
  return { near, wallet };
}
