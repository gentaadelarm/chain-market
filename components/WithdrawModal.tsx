"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BrowserProvider,
  Contract,
  formatEther,
  formatUnits,
  isAddress,
  parseUnits,
} from "ethers";

type WithdrawAsset = {
  wallet_id: string;
  balance: string;
  price_usd: number;
  value_usd: number;
  asset: {
    symbol: string;
    name: string;
    chain: string;
    network: string;
    contract_address: string | null;
    decimals: number;
    is_native: boolean;
    logo_url: string | null;
  } | null;
};

type Props = {
  open: boolean;
  darkMode: boolean;
  balances: WithdrawAsset[];
  connectedEvmAddress: string | null;
  connectedSolanaAddress: string | null;
  onClose: () => void;
};

type EvmProvider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
};

const CHAIN_IDS: Record<string, string> = {
  "eth-mainnet": "0x1",
  "bnb-mainnet": "0x38",
  "base-mainnet": "0x2105",
  "arb-mainnet": "0xa4b1",
  "opt-mainnet": "0xa",
  "matic-mainnet": "0x89",
  "zksync-mainnet": "0x1a4",
  "linea-mainnet": "0xe708",
  "scroll-mainnet": "0x82750",
  "blast-mainnet": "0x13e31",
  "zora-mainnet": "0x76adf1",
  "gnosis-mainnet": "0x64",
  "celo-mainnet": "0xa4ec",
  "worldchain-mainnet": "0x10ea",
  "unichain-mainnet": "0x82",
  "soneium-mainnet": "0x12c",
  "ink-mainnet": "0xdef1",
  "berachain-mainnet": "0x138de",
  "apechain-mainnet": "0x8173",
  "shape-mainnet": "0x1f91",
  "rootstock-mainnet": "0x1e",
  "zetachain-mainnet": "0x1b59",
  "monad-mainnet": "0x8f",
};

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
];

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Transaction gagal.";
}

async function findEvmProvider(
  address: string
): Promise<EvmProvider | null> {
  const ethereum = (
    window as Window & {
      ethereum?: EvmProvider & {
        providers?: EvmProvider[];
      };
    }
  ).ethereum;

  if (!ethereum) return null;

  const candidates = Array.isArray(ethereum.providers)
    ? ethereum.providers
    : [ethereum];

  const wanted = address.toLowerCase();

  for (const provider of candidates) {
    try {
      const accounts = await provider.request({
        method: "eth_accounts",
      });

      if (
        Array.isArray(accounts) &&
        accounts.some(
          (item) =>
            typeof item === "string" &&
            item.toLowerCase() === wanted
        )
      ) {
        return provider;
      }
    } catch {
      // Ignore providers that reject eth_accounts.
    }
  }

  return null;
}

export default function WithdrawModal({
  open,
  darkMode,
  balances,
  connectedEvmAddress,
  connectedSolanaAddress,
  onClose,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const [estimating, setEstimating] = useState(false);
  const [sending, setSending] = useState(false);

  const [gasFee, setGasFee] = useState<bigint | null>(null);
  const [gasPrice, setGasPrice] = useState<bigint | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [message, setMessage] = useState("");

  const usableBalances = useMemo(
    () =>
      balances.filter(
        (item) =>
          item.asset &&
          item.asset.chain !== "solana" &&
          Number(item.balance) > 0
      ),
    [balances]
  );

  const selected = usableBalances[selectedIndex] ?? null;
  const asset = selected?.asset ?? null;

  useEffect(() => {
    if (!open) return;

    setSelectedIndex(0);
    setRecipient("");
    setAmount("");
    setGasFee(null);
    setGasPrice(null);
    setPreviewReady(false);
    setMessage("");
  }, [open]);

  useEffect(() => {
    setGasFee(null);
    setGasPrice(null);
    setPreviewReady(false);
    setMessage("");
  }, [selectedIndex, recipient]);

  if (!open) return null;

  const resetPreview = () => {
    setGasFee(null);
    setGasPrice(null);
    setPreviewReady(false);
  };

  const validateInputs = () => {
    if (!connectedEvmAddress) {
      return "Connect EVM wallet terlebih dahulu.";
    }

    if (!selected || !asset) {
      return "Pilih asset terlebih dahulu.";
    }

    const to = recipient.trim();

    if (!to) {
      return "Masukkan recipient address.";
    }

    if (!isAddress(to)) {
      return "Recipient address EVM tidak valid.";
    }

    if (!amount.trim()) {
      return "Masukkan amount.";
    }

    let parsedAmount: bigint;

    try {
      parsedAmount = parseUnits(
        amount.trim(),
        asset.decimals
      );
    } catch {
      return `Amount tidak valid. Maksimal ${asset.decimals} decimal.`;
    }

    if (parsedAmount <= 0n) {
      return "Amount harus lebih besar dari 0.";
    }

    let rawBalance: bigint;

    try {
      rawBalance = parseUnits(
        selected.balance,
        asset.decimals
      );
    } catch {
      return "Balance wallet tidak valid.";
    }

    if (parsedAmount > rawBalance) {
      return `Saldo tidak cukup. Available ${selected.balance} ${asset.symbol}.`;
    }

    if (!CHAIN_IDS[asset.network]) {
      return `Network ${asset.network} belum memiliki konfigurasi chain ID.`;
    }

    return null;
  };

  const estimate = async () => {
    setMessage("");
    resetPreview();

    const validationError = validateInputs();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    if (!connectedEvmAddress || !selected || !asset) {
      return;
    }

    setEstimating(true);

    try {
      const provider = await findEvmProvider(
        connectedEvmAddress
      );

      if (!provider) {
        throw new Error(
          "Provider wallet yang terhubung tidak ditemukan. Reconnect wallet lalu coba lagi."
        );
      }

      const wantedChain = CHAIN_IDS[asset.network];

      const currentChain = await provider.request({
        method: "eth_chainId",
      });

      if (
        typeof currentChain !== "string" ||
        currentChain.toLowerCase() !== wantedChain.toLowerCase()
      ) {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: wantedChain }],
        });
      }

      const ethersProvider = new BrowserProvider(
        provider
      );

      const signer = await ethersProvider.getSigner();

      const to = recipient.trim();
      const value = parseUnits(
        amount.trim(),
        asset.decimals
      );

      let gasEstimate: bigint;

      if (asset.is_native) {
        gasEstimate = await ethersProvider.estimateGas({
          from: connectedEvmAddress,
          to,
          value,
        });
      } else {
        if (!asset.contract_address) {
          throw new Error(
            "Contract address token tidak tersedia."
          );
        }

        const token = new Contract(
          asset.contract_address,
          ERC20_ABI,
          signer
        );

        gasEstimate = await token.transfer.estimateGas(
          to,
          value
        );
      }

      const feeData = await ethersProvider.getFeeData();

      const effectiveGasPrice =
        feeData.maxFeePerGas ??
        feeData.gasPrice;

      if (!effectiveGasPrice) {
        throw new Error(
          "Gas price network tidak tersedia."
        );
      }

      const estimatedFee =
        gasEstimate * effectiveGasPrice;

      const nativeBalance =
        await ethersProvider.getBalance(
          connectedEvmAddress
        );

      if (asset.is_native) {
        if (value + estimatedFee > nativeBalance) {
          throw new Error(
            `Native balance tidak cukup untuk amount + gas. Available ${formatEther(
              nativeBalance
            )}.`
          );
        }
      } else if (estimatedFee > nativeBalance) {
        throw new Error(
          `Native balance tidak cukup untuk gas. Estimasi fee ${formatEther(
            estimatedFee
          )}.`
        );
      }

      setGasFee(estimatedFee);
      setGasPrice(effectiveGasPrice);
      setPreviewReady(true);

      setMessage(
        "Preview transaksi berhasil. Review detail lalu klik Confirm & Send."
      );
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setEstimating(false);
    }
  };

  const send = async () => {
    if (!previewReady) {
      await estimate();
      return;
    }

    const validationError = validateInputs();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    if (!connectedEvmAddress || !selected || !asset) {
      return;
    }

    setSending(true);
    setMessage("");

    try {
      const provider = await findEvmProvider(
        connectedEvmAddress
      );

      if (!provider) {
        throw new Error(
          "Provider wallet yang terhubung tidak ditemukan. Reconnect wallet lalu coba lagi."
        );
      }

      const wantedChain = CHAIN_IDS[asset.network];

      const currentChain = await provider.request({
        method: "eth_chainId",
      });

      if (
        typeof currentChain !== "string" ||
        currentChain.toLowerCase() !== wantedChain.toLowerCase()
      ) {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: wantedChain }],
        });
      }

      const ethersProvider = new BrowserProvider(
        provider
      );

      const signer = await ethersProvider.getSigner();
      const to = recipient.trim();
      const value = parseUnits(
        amount.trim(),
        asset.decimals
      );

      let tx;

      if (asset.is_native) {
        tx = await signer.sendTransaction({
          to,
          value,
        });
      } else {
        if (!asset.contract_address) {
          throw new Error(
            "Contract address token tidak tersedia."
          );
        }

        const token = new Contract(
          asset.contract_address,
          ERC20_ABI,
          signer
        );

        tx = await token.transfer(to, value);
      }

      setMessage(
        `Transaction submitted: ${tx.hash}`
      );

      await tx.wait();

      setMessage(
        `Transaction confirmed: ${tx.hash}`
      );

      setAmount("");
      setRecipient("");
      resetPreview();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const inputClass = `mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none ${
    darkMode
      ? "border-zinc-700 bg-zinc-950"
      : "border-zinc-200 bg-white"
  }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !sending &&
          !estimating
        ) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl ${
          darkMode
            ? "bg-zinc-900 text-white"
            : "bg-white text-zinc-950"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black">
              Withdraw / Send
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Kirim aset langsung dari connected wallet.
            </p>
          </div>

          <button
            type="button"
            disabled={sending || estimating}
            onClick={onClose}
            className="rounded-full px-3 py-1 text-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {connectedSolanaAddress && (
          <div className="mt-4 rounded-xl bg-blue-500/10 p-3 text-xs text-blue-600">
            Solana wallet terhubung. Solana Send akan kita
            aktifkan setelah EVM flow selesai.
          </div>
        )}

        {usableBalances.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-600">
            Tidak ada EVM asset dengan balance yang bisa
            digunakan untuk withdrawal.
          </div>
        ) : (
          <>
            <div className="mt-6">
              <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Asset
              </label>

              <select
                value={selectedIndex}
                onChange={(event) => {
                  setSelectedIndex(
                    Number(event.target.value)
                  );
                  setAmount("");
                  resetPreview();
                  setMessage("");
                }}
                disabled={sending || estimating}
                className={inputClass}
              >
                {usableBalances.map((item, index) => (
                  <option
                    key={`${item.asset?.network}-${item.asset?.symbol}-${index}`}
                    value={index}
                  >
                    {item.asset?.symbol} ·{" "}
                    {item.asset?.network} ·{" "}
                    {item.balance}
                  </option>
                ))}
              </select>
            </div>

            {asset && selected && (
              <div className="mt-4 rounded-2xl bg-zinc-500/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold">
                    {asset.name}
                  </span>

                  <span className="text-right text-sm font-bold">
                    {selected.balance}{" "}
                    {asset.symbol}
                  </span>
                </div>

                <p className="mt-1 text-xs text-zinc-500">
                  {asset.network}
                  {asset.contract_address
                    ? ` · ${shortAddress(
                        asset.contract_address
                      )}`
                    : " · Native"}
                </p>
              </div>
            )}

            <div className="mt-5">
              <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Recipient Address
              </label>

              <input
                value={recipient}
                onChange={(event) => {
                  setRecipient(event.target.value);
                  resetPreview();
                  setMessage("");
                }}
                disabled={sending || estimating}
                placeholder="0x..."
                className={`${inputClass} font-mono`}
              />
            </div>

            <div className="mt-4">
              <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Amount
              </label>

              <div className="mt-2 flex gap-2">
                <input
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    resetPreview();
                    setMessage("");
                  }}
                  disabled={sending || estimating}
                  inputMode="decimal"
                  placeholder="0.00"
                  className={`min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none ${
                    darkMode
                      ? "border-zinc-700 bg-zinc-950"
                      : "border-zinc-200 bg-white"
                  }`}
                />

                <button
                  type="button"
                  disabled={
                    sending ||
                    estimating ||
                    !selected
                  }
                  onClick={() => {
                    setAmount(
                      selected?.balance ?? ""
                    );
                    resetPreview();
                    setMessage("");
                  }}
                  className="rounded-xl border px-4 py-3 text-sm font-bold"
                >
                  MAX
                </button>
              </div>
            </div>

            {previewReady &&
              gasFee !== null &&
              gasPrice !== null &&
              asset && (
                <div
                  className={`mt-4 rounded-2xl p-4 ${
                    darkMode
                      ? "bg-emerald-500/10"
                      : "bg-emerald-50"
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Transaction Preview
                  </p>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span>Network</span>
                      <span className="font-bold">
                        {asset.network}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span>Asset</span>
                      <span className="font-bold">
                        {asset.symbol}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span>Recipient</span>
                      <span className="font-mono text-xs">
                        {shortAddress(
                          recipient.trim()
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span>Amount</span>
                      <span className="font-bold">
                        {amount} {asset.symbol}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                      <span>Estimated network fee</span>
                      <span className="font-bold">
                        {formatEther(gasFee)} native
                      </span>
                    </div>

                    <p className="pt-1 text-xs text-zinc-500">
                      Gas price:{" "}
                      {formatUnits(gasPrice, 9)} Gwei
                    </p>
                  </div>
                </div>
              )}

            <div className="mt-4 rounded-2xl bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-500">
              Pastikan network, recipient, dan amount
              benar. Transaksi blockchain tidak bisa
              dibatalkan setelah dikonfirmasi.
            </div>

            {message && (
              <div className="mt-4 break-all rounded-2xl bg-blue-500/10 p-4 text-xs text-blue-600">
                {message}
              </div>
            )}

            {!previewReady ? (
              <button
                type="button"
                disabled={
                  sending || estimating
                }
                onClick={estimate}
                className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {estimating
                  ? "Estimating fee..."
                  : "Preview Transaction"}
              </button>
            ) : (
              <button
                type="button"
                disabled={sending || estimating}
                onClick={send}
                className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending
                  ? "Waiting for wallet..."
                  : "Confirm & Send"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
