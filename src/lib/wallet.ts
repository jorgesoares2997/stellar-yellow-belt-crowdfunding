import {
  FREIGHTER_ID,
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules
} from "@creit.tech/stellar-wallets-kit";

export type WalletErrorCode =
  | "WALLET_NOT_FOUND"
  | "WALLET_REJECTED"
  | "INSUFFICIENT_BALANCE"
  | "UNKNOWN";

export class WalletAppError extends Error {
  code: WalletErrorCode;
  constructor(code: WalletErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function getKit() {
  if (typeof window === "undefined") {
    throw new WalletAppError("WALLET_NOT_FOUND", "Wallets are only available in the browser.");
  }
  return new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    selectedWalletId: FREIGHTER_ID,
    modules: allowAllModules()
  });
}

export async function connectWallet(): Promise<string> {
  try {
    const kit = getKit();
    await kit.openModal({
      onWalletSelected: async (option) => {
        kit.setWallet(option.id);
      }
    });

    const { address } = await kit.getAddress();
    if (!address) {
      throw new WalletAppError("WALLET_NOT_FOUND", "No wallet address returned.");
    }
    return address;
  } catch (error: any) {
    const message = String(error?.message ?? "");
    if (error instanceof WalletAppError) throw error;
    if (/reject|declin|denied|cancel/i.test(message)) {
      throw new WalletAppError("WALLET_REJECTED", "Wallet connection was rejected.");
    }
    if (/not found|install|unavailable/i.test(message)) {
      throw new WalletAppError("WALLET_NOT_FOUND", "No compatible wallet found.");
    }
    throw new WalletAppError("UNKNOWN", message || "Wallet connection failed.");
  }
}

export async function signXdr(xdr: string, networkPassphrase: string) {
  const kit = getKit();
  return kit.signTransaction(xdr, { networkPassphrase });
}
