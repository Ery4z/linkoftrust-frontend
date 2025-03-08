import { StorageService } from "@near-wallet-selector/core";

export class CustomStorageService implements StorageService {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(`${this.prefix}_${key}`);
  }

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(`${this.prefix}_${key}`, value);
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(`${this.prefix}_${key}`);
  }
}
