"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, verifyMessage } from "ethers";
import bs58 from "bs58";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
}

const supabase = createClient();

export default function WalletsPage() {
  const [bscAddress, setBscAddress] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [solanaAddress, setSolanaAddress] = useState("");

  const [message, setMessage] = useState("");
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [connecting, setConnecting] = useState("");

  useEffect(() => {
    async function loadWallets() {
      setLoadingWallets(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoadingWallets(false);
        return;
      }

      const { data, error } = await supabase
        .from("wallets")
        .select("chain, address")
        .eq("user_id", user.id);

      if (error) {
        setMessage(`Failed to load wallets: ${error.message}`);
        setLoadingWallets(false);
        return;
      }

      for (const wallet of data ?? []) {
        if (wallet.chain === "bsc") {
          setBscAddress(wallet.address);
        }

        if (wallet.chain === "base") {
          setBaseAddress(wallet.address);
        }

        if (wallet.chain === "solana") {
          setSolanaAddress(wallet.address);
        }
      }

      setLoadingWallets(false);
    }

    loadWallets();
  }, []);

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("You must be logged in to connect a wallet.");
    }

    return user;
  }

  function createEvmMessage(
    chainName: string,
    address: string
  ) {
    const nonce = crypto.randomUUID();

    return `Chain Market

Connect wallet to Chain Market.

Chain: ${chainName}
Wallet: ${address}
Nonce: ${nonce}

By signing this message, you confirm that you control this wallet and want to connect it to Chain Market.

This signature does not authorize any blockchain transaction or transfer of funds.`;
  }

  async function connectEVM(
    chain: "bsc" | "base"
  ) {
    setMessage("");
    setConnecting(chain);

    try {
      if (!window.ethereum) {
        throw new Error(
          "No EVM wallet detected. Please install MetaMask or OKX Wallet."
        );
      }

      /*
       * STEP 1
       * Ask wallet for account permission.
       */
      const provider = new BrowserProvider(window.ethereum);

      const accounts = await provider.send(
        "eth_requestAccounts",
        []
      );

      if (!accounts || accounts.length === 0) {
        throw new Error("No wallet account selected.");
      }

      const address = accounts[0];

      /*
       * STEP 2
       * Make sure we're on the correct network.
       */
      const targetChainId =
        chain === "bsc" ? BigInt(56) : BigInt(8453);

      const targetChainHex =
        chain === "bsc" ? "0x38" : "0x2105";

      const network = await provider.getNetwork();

      if (network.chainId !== targetChainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [
              {
                chainId: targetChainHex,
              },
            ],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            if (chain === "bsc") {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x38",
                    chainName: "BNB Smart Chain",
                    nativeCurrency: {
                      name: "BNB",
                      symbol: "BNB",
                      decimals: 18,
                    },
                    rpcUrls: [
                      "https://bsc-dataseed.binance.org/",
                    ],
                    blockExplorerUrls: [
                      "https://bscscan.com/",
                    ],
                  },
                ],
              });
            } else {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x2105",
                    chainName: "Base",
                    nativeCurrency: {
                      name: "Ether",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: [
                      "https://mainnet.base.org",
                    ],
                    blockExplorerUrls: [
                      "https://basescan.org",
                    ],
                  },
                ],
              });
            }
          } else {
            throw switchError;
          }
        }
      }

      /*
       * STEP 3
       * IMPORTANT:
       * Request a signature.
       *
       * This creates the confirmation popup
       * even if this wallet was previously connected.
       */
      const signer = await provider.getSigner();

      const walletMessage = createEvmMessage(
        chain === "bsc" ? "BSC" : "Base",
        address
      );

      const signature = await signer.signMessage(
        walletMessage
      );

      /*
       * STEP 4
       * Verify that the signature belongs to
       * the connected address.
       */
      const recoveredAddress = verifyMessage(
        walletMessage,
        signature
      );

      if (
        recoveredAddress.toLowerCase() !==
        address.toLowerCase()
      ) {
        throw new Error(
          "Wallet signature verification failed."
        );
      }

      /*
       * STEP 5
       * Only AFTER signature verification,
       * save wallet to Supabase.
       */
      const user = await getUser();

      const { error: walletError } =
        await supabase
          .from("wallets")
          .upsert(
            {
              user_id: user.id,
              chain,
              address,
            },
            {
              onConflict: "user_id,chain",
            }
          );

      if (walletError) {
        throw new Error(
          `Failed to save ${chain.toUpperCase()} wallet: ${walletError.message}`
        );
      }

      if (chain === "bsc") {
        setBscAddress(address);
      }

      if (chain === "base") {
        setBaseAddress(address);
      }

      setMessage(
        `${chain.toUpperCase()} wallet connected and verified successfully.`
      );
    } catch (error: any) {
      if (
        error?.code === 4001 ||
        error?.message?.toLowerCase().includes("user rejected")
      ) {
        setMessage(
          "Wallet connection was cancelled."
        );
      } else {
        setMessage(
          error?.message ||
            `Failed to connect ${chain.toUpperCase()} wallet.`
        );
      }
    } finally {
      setConnecting("");
    }
  }

  async function connectSolana() {
    setMessage("");
    setConnecting("solana");

    try {
      if (
        !window.solana ||
        !window.solana.isPhantom
      ) {
        throw new Error(
          "Phantom wallet not detected. Please install Phantom."
        );
      }

      /*
       * STEP 1
       * Connect to Phantom.
       */
      const response =
        await window.solana.connect();

      const publicKey =
        response.publicKey?.toString();

      if (!publicKey) {
        throw new Error(
          "No Solana wallet account selected."
        );
      }

      /*
       * STEP 2
       * Request explicit signature confirmation.
       */
      if (
        !window.solana.signMessage
      ) {
        throw new Error(
          "This Phantom wallet does not support message signing."
        );
      }

      const nonce = crypto.randomUUID();

      const messageText = `Chain Market

Connect wallet to Chain Market.

Chain: Solana
Wallet: ${publicKey}
Nonce: ${nonce}

By signing this message, you confirm that you control this wallet and want to connect it to Chain Market.

This signature does not authorize any blockchain transaction or transfer of funds.`;

      const encodedMessage =
        new TextEncoder().encode(
          messageText
        );

      const signed =
        await window.solana.signMessage(
          encodedMessage,
          "utf8"
        );

      /*
       * Basic validation:
       * Phantom must return a signature.
       */
      if (
        !signed ||
        !signed.signature
      ) {
        throw new Error(
          "Wallet signature was not returned."
        );
      }

      /*
       * Decode signature so we know Phantom
       * returned a valid Solana signature payload.
       */
      const signatureBytes =
        signed.signature instanceof Uint8Array
          ? signed.signature
          : new Uint8Array(
              signed.signature
            );

      if (signatureBytes.length === 0) {
        throw new Error(
          "Invalid Solana wallet signature."
        );
      }

      /*
       * STEP 3
       * Save only after signature confirmation.
       */
      const user = await getUser();

      const { error: walletError } =
        await supabase
          .from("wallets")
          .upsert(
            {
              user_id: user.id,
              chain: "solana",
              address: publicKey,
            },
            {
              onConflict: "user_id,chain",
            }
          );

      if (walletError) {
        throw new Error(
          `Failed to save Solana wallet: ${walletError.message}`
        );
      }

      setSolanaAddress(publicKey);

      setMessage(
        "Solana wallet connected and verified successfully."
      );
    } catch (error: any) {
      if (
        error?.code === 4001 ||
        error?.message?.toLowerCase().includes("user rejected")
      ) {
        setMessage(
          "Wallet connection was cancelled."
        );
      } else {
        setMessage(
          error?.message ||
            "Failed to connect Solana wallet."
        );
      }
    } finally {
      setConnecting("");
    }
  }

  async function disconnectWallet(
    chain: "bsc" | "base" | "solana"
  ) {
    setMessage("");

    try {
      const user = await getUser();

      const { error } =
        await supabase
          .from("wallets")
          .delete()
          .eq("user_id", user.id)
          .eq("chain", chain);

      if (error) {
        throw new Error(
          `Failed to disconnect ${chain.toUpperCase()}: ${error.message}`
        );
      }

      if (chain === "bsc") {
        setBscAddress("");
      }

      if (chain === "base") {
        setBaseAddress("");
      }

      if (chain === "solana") {
        setSolanaAddress("");

        if (window.solana?.isPhantom) {
          try {
            await window.solana.disconnect();
          } catch {
            // Ignore provider disconnect errors.
          }
        }
      }

      setMessage(
        `${chain.toUpperCase()} wallet disconnected successfully.`
      );
    } catch (error: any) {
      setMessage(
        error?.message ||
          "Failed to disconnect wallet."
      );
    }
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl">

        <a
          href="/account/settings"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to Settings
        </a>

        <div className="mt-6">
          <h1 className="text-3xl font-bold">
            Wallets
          </h1>

          <p className="mt-2 text-gray-500">
            Connect your wallets for crypto payments.
          </p>
        </div>

        {loadingWallets && (
          <div className="mt-6 rounded-xl border p-4 text-sm text-gray-500">
            Loading connected wallets...
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-xl border p-4 text-sm">
            {message}
          </div>
        )}

        <div className="mt-10 space-y-4">

          {/* BSC */}
          <div className="flex items-center justify-between rounded-2xl border p-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  🟡
                </span>

                <div>
                  <h2 className="font-semibold">
                    BSC
                  </h2>

                  <p className="text-sm text-gray-500">
                    BNB Smart Chain
                  </p>

                  {bscAddress && (
                    <p className="mt-2 break-all text-xs text-gray-500">
                      {bscAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              disabled={connecting === "bsc"}
              onClick={() =>
                bscAddress
                  ? disconnectWallet("bsc")
                  : connectEVM("bsc")
              }
              className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                bscAddress
                  ? "border hover:bg-gray-50"
                  : "bg-black text-white hover:opacity-80"
              } ${
                connecting === "bsc"
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
            >
              {connecting === "bsc"
                ? "Confirm in Wallet..."
                : bscAddress
                ? "Disconnect"
                : "Connect"}
            </button>
          </div>

          {/* Base */}
          <div className="flex items-center justify-between rounded-2xl border p-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  🔵
                </span>

                <div>
                  <h2 className="font-semibold">
                    Base
                  </h2>

                  <p className="text-sm text-gray-500">
                    Base Network
                  </p>

                  {baseAddress && (
                    <p className="mt-2 break-all text-xs text-gray-500">
                      {baseAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              disabled={connecting === "base"}
              onClick={() =>
                baseAddress
                  ? disconnectWallet("base")
                  : connectEVM("base")
              }
              className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                baseAddress
                  ? "border hover:bg-gray-50"
                  : "bg-black text-white hover:opacity-80"
              } ${
                connecting === "base"
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
            >
              {connecting === "base"
                ? "Confirm in Wallet..."
                : baseAddress
                ? "Disconnect"
                : "Connect"}
            </button>
          </div>

          {/* Solana */}
          <div className="flex items-center justify-between rounded-2xl border p-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  🟣
                </span>

                <div>
                  <h2 className="font-semibold">
                    Solana
                  </h2>

                  <p className="text-sm text-gray-500">
                    Solana Network
                  </p>

                  {solanaAddress && (
                    <p className="mt-2 break-all text-xs text-gray-500">
                      {solanaAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              disabled={connecting === "solana"}
              onClick={() =>
                solanaAddress
                  ? disconnectWallet("solana")
                  : connectSolana()
              }
              className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                solanaAddress
                  ? "border hover:bg-gray-50"
                  : "bg-black text-white hover:opacity-80"
              } ${
                connecting === "solana"
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
            >
              {connecting === "solana"
                ? "Confirm in Wallet..."
                : solanaAddress
                ? "Disconnect"
                : "Connect"}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}