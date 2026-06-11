"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth-store";
import { usePlatformFee } from "@/hooks/usePlatformFee";
import { useSavedWallets } from "@/hooks/useSavedWallets";
import FeeDisclosure from "@/components/ui/FeeDisclosure";
import Select from "@/components/ui/Select";
import PaymentForm from "@/components/ui/PaymentForm";
import Link from "next/link";

type Step = "details" | "review" | "payment" | "success";

const cardClasses = "bg-surface-1/60 backdrop-blur-sm border border-border-default rounded-xl p-5";
const inputClasses =
  "w-full px-4 py-2.5 bg-fill-subtle/50 border border-border-default rounded-lg text-sm text-text-secondary placeholder:text-text-phantom focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors";
const labelClasses = "block text-xs font-medium text-text-muted mb-1.5";

const NETWORKS = [
  "Bitcoin", "Ethereum", "BNB Chain", "Tron",
  "Solana", "Polygon", "Avalanche", "Arbitrum", "Optimism", "Base",
];

const NETWORK_BADGES: Record<string, { abbr: string; bg: string; text: string }> = {
  Bitcoin:     { abbr: "BTC",  bg: "bg-orange-500/20",  text: "text-orange-400" },
  Ethereum:    { abbr: "ETH",  bg: "bg-blue-500/20",    text: "text-blue-400" },
  "BNB Chain": { abbr: "BNB",  bg: "bg-yellow-500/20",  text: "text-yellow-400" },
  Tron:        { abbr: "TRX",  bg: "bg-red-500/20",     text: "text-red-400" },
  Solana:      { abbr: "SOL",  bg: "bg-purple-500/20",  text: "text-purple-400" },
  Polygon:     { abbr: "POL",  bg: "bg-violet-500/20",  text: "text-violet-400" },
  Avalanche:   { abbr: "AVAX", bg: "bg-red-600/20",     text: "text-red-500" },
  Arbitrum:    { abbr: "ARB",  bg: "bg-sky-500/20",     text: "text-sky-400" },
  Optimism:    { abbr: "OP",   bg: "bg-rose-500/20",    text: "text-rose-400" },
  Base:        { abbr: "BASE", bg: "bg-blue-600/20",    text: "text-blue-500" },
};

const WALLET_VALIDATORS: Record<string, { regex: RegExp; hint: string; warning?: boolean }> = {
  Bitcoin:     { regex: /^(bc1[a-z0-9]{25,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/, hint: "Legacy (starts with 1 or 3) or SegWit (starts with bc1)" },
  Ethereum:    { regex: /^0x[a-fA-F0-9]{40}$/, hint: "Starts with 0x, 42 characters total" },
  "BNB Chain": { regex: /^0x[a-fA-F0-9]{40}$/, hint: "Starts with 0x, 42 characters total" },
  Tron:        { regex: /^T[a-zA-Z0-9]{33}$/, hint: "Starts with T, 34 characters total" },
  Solana:      { regex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, hint: "Base58 format, 32–44 characters", warning: true },
  Polygon:     { regex: /^0x[a-fA-F0-9]{40}$/, hint: "Starts with 0x, 42 characters total" },
  Avalanche:   { regex: /^0x[a-fA-F0-9]{40}$/, hint: "C-Chain format, starts with 0x, 42 characters total" },
  Arbitrum:    { regex: /^0x[a-fA-F0-9]{40}$/, hint: "Starts with 0x, 42 characters total" },
  Optimism:    { regex: /^0x[a-fA-F0-9]{40}$/, hint: "Starts with 0x, 42 characters total" },
  Base:        { regex: /^0x[a-fA-F0-9]{40}$/, hint: "Starts with 0x, 42 characters total" },
};

function validateAddress(network: string, address: string): { valid: boolean; error?: string; warning?: string } {
  if (!address || !network) return { valid: true };
  const validator = WALLET_VALIDATORS[network];
  if (!validator) return { valid: true };
  if (!validator.regex.test(address.trim())) {
    if (validator.warning) return { valid: true, warning: `Address format looks unusual for ${network} — double-check before saving` };
    return { valid: false, error: `Invalid ${network} address format. ${validator.hint}` };
  }
  return { valid: true };
}

function NetworkBadge({ network }: { network: string }) {
  const badge = NETWORK_BADGES[network];
  if (!badge) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
      {badge.abbr}
    </span>
  );
}

function truncateAddress(addr: string) {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

const slideVariants = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -40, opacity: 0 },
};

export default function CryptoPurchasePage() {
  const router = useRouter();
  const { fee: platformFee } = usePlatformFee();
  const { wallets, loading: walletsLoading } = useSavedWallets();

  // Step management
  const [step, setStep] = useState<Step>("details");
  const [stepDirection, setStepDirection] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 1 state
  const [amount, setAmount] = useState("");
  const [walletTab, setWalletTab] = useState<"saved" | "manual">("saved");
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [manualNetwork, setManualNetwork] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualMemo, setManualMemo] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressWarning, setAddressWarning] = useState<string | null>(null);

  // Payment step state (from /prepare response)
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [preparedRefId, setPreparedRefId] = useState<string | null>(null);
  const [preparedAmount, setPreparedAmount] = useState<string | null>(null);
  const [preparedFeePercent, setPreparedFeePercent] = useState<string | null>(null);
  const [preparedFeeAmount, setPreparedFeeAmount] = useState<string | null>(null);
  const [preparedTotalAmount, setPreparedTotalAmount] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentFormKey, setPaymentFormKey] = useState(0);
  const [preparing, setPreparing] = useState(false);

  // Success step state
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [processingTimeout, setProcessingTimeout] = useState(false);
  const pollRef = useRef<NodeJS.Timeout[]>([]);

  const resetAll = () => {
    setStep("details");
    setStepDirection(1);
    setAmount("");
    setWalletTab("saved");
    setSelectedWalletId(null);
    setManualNetwork("");
    setManualAddress("");
    setManualMemo("");
    setAddressError(null);
    setAddressWarning(null);
    setSubmitError(null);
    setClientSecret(null);
    setPreparedRefId(null);
    setPreparedAmount(null);
    setPreparedFeePercent(null);
    setPreparedFeeAmount(null);
    setPreparedTotalAmount(null);
    setPaymentError(null);
    setPaymentFormKey(0);
    setPreparing(false);
    setPaymentConfirmed(false);
    setProcessingTimeout(false);
    pollRef.current.forEach(clearTimeout);
    pollRef.current = [];
  };

  // Derived
  const numAmount = parseFloat(amount) || 0;
  const feeAmount = parseFloat((numAmount * (platformFee / 100)).toFixed(2));
  const totalAmount = parseFloat((numAmount + feeAmount).toFixed(2));

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId) || null;
  const effectiveNetwork = selectedWallet ? selectedWallet.network : manualNetwork;
  const effectiveAddress = selectedWallet ? selectedWallet.wallet_address : manualAddress.trim();
  const effectiveLabel = selectedWallet ? selectedWallet.label : null;
  const effectiveMemo = selectedWallet ? null : (manualMemo.trim() || null);

  const canContinue = numAmount > 0 && (selectedWalletId !== null || (manualNetwork && manualAddress.trim() && !addressError));

  const validateManualAddress = useCallback(() => {
    if (!manualNetwork || !manualAddress.trim()) { setAddressError(null); setAddressWarning(null); return; }
    const result = validateAddress(manualNetwork, manualAddress);
    setAddressError(result.error || null);
    setAddressWarning(result.warning || null);
  }, [manualNetwork, manualAddress]);

  const handleContinue = () => {
    if (numAmount <= 0) return;
    if (walletTab === "saved" && !selectedWalletId) return;
    if (walletTab === "manual") {
      const result = validateAddress(manualNetwork, manualAddress);
      if (!result.valid) { setAddressError(result.error || "Invalid address"); return; }
    }
    setSubmitError(null);
    setStepDirection(1);
    setStep("review");
  };

  const handleBack = () => {
    setStepDirection(-1);
    setStep("details");
  };

  // ── Confirm & Pay: call /prepare (once), then go to payment step ──
  const handleConfirm = async () => {
    // If we already have a clientSecret, skip straight to payment
    if (clientSecret) {
      setStepDirection(1);
      setStep("payment");
      return;
    }

    setSubmitError(null);
    setPreparing(true);
    try {
      const res = await authFetch("/crypto-purchases/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          network: effectiveNetwork,
          wallet_address: effectiveAddress,
          wallet_label: effectiveLabel,
          memo: effectiveMemo,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to prepare purchase");
      }
      const data = await res.json();

      setClientSecret(data.clientSecret);
      setPreparedRefId(data.refId);
      setPreparedAmount(data.amount);
      setPreparedFeePercent(data.handlingFeePercent);
      setPreparedFeeAmount(data.handlingFeeAmount);
      setPreparedTotalAmount(data.totalAmount);
      setPaymentError(null);
      setPaymentFormKey((k) => k + 1);
      setStepDirection(1);
      setStep("payment");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPreparing(false);
    }
  };

  // ── Payment success: transition to success step ──
  const handlePaymentSuccess = () => {
    setStepDirection(1);
    setStep("success");
  };

  // ── Payment error ──
  const handlePaymentError = (message: string) => {
    setPaymentError(message);
  };

  const handleTryAgain = () => {
    setPaymentError(null);
    setPaymentFormKey((k) => k + 1);
  };

  // ── Go back from payment step to review ──
  const handleBackFromPayment = () => {
    setStepDirection(-1);
    setStep("review");
  };

  // ── Poll for purchase record on success step (webhook creates the record) ──
  useEffect(() => {
    if (step !== "success" || !preparedRefId) return;
    setPaymentConfirmed(false);
    setProcessingTimeout(false);

    let cancelled = false;
    const timers: NodeJS.Timeout[] = [];

    const check = async (): Promise<boolean> => {
      try {
        const res = await authFetch(`/crypto-purchases/by-ref/${preparedRefId}`);
        if (!res.ok || cancelled) return false;
        // 404 means record not yet created by webhook
        if (res.status === 404) return false;
        const data = await res.json();
        // Record found — payment confirmed
        setPaymentConfirmed(true);
        return true;
      } catch {
        return false;
      }
    };

    // Immediate check
    check().then((found) => {
      if (cancelled || found) return;

      // Poll every 2 seconds, up to 10 times
      let count = 0;
      const maxPolls = 10;

      const poll = async () => {
        if (cancelled) return;
        count++;
        const found = await check();
        if (cancelled || found) return;

        if (count >= maxPolls) {
          // After 20s, show timeout message with ref
          setProcessingTimeout(true);
          setPaymentConfirmed(true); // Stop spinner, show processing message
          return;
        }

        const t = setTimeout(poll, 2000);
        timers.push(t);
      };

      const t = setTimeout(poll, 2000);
      timers.push(t);
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [step, preparedRefId]);

  return (
    <div className="min-h-full p-6 max-w-2xl mx-auto">
      <AnimatePresence mode="wait" custom={stepDirection}>
        {/* ──────────────────── STEP 1 — Details ──────────────────── */}
        {step === "details" && (
          <motion.div key="details" custom={stepDirection} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
            <h1 className="text-xl font-semibold text-text-secondary">Buy Crypto</h1>
            <p className="text-sm text-text-muted mt-0.5 mb-6">Enter your purchase amount and destination wallet</p>

            {/* Amount card */}
            <div className={cardClasses}>
              <h2 className="text-sm font-semibold text-text-secondary mb-3">Purchase Amount</h2>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-sm text-text-muted font-medium pointer-events-none">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                      setAmount(val);
                    }
                  }}
                  placeholder="0.00"
                  min={1}
                  step={0.01}
                  className={`${inputClasses} pl-8 pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                />
                <span className="absolute right-4 text-xs text-text-muted font-medium pointer-events-none">USD</span>
              </div>
              <div className="mt-2">
                <FeeDisclosure fee={platformFee} />
              </div>
            </div>

            {/* Destination Wallet card */}
            <div className={`${cardClasses} mt-4`}>
              <h2 className="text-sm font-semibold text-text-secondary mb-3">Destination Wallet</h2>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-fill-subtle/50 rounded-lg mb-4">
                <button
                  onClick={() => setWalletTab("saved")}
                  className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${
                    walletTab === "saved" ? "bg-accent text-white" : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  Saved Wallet
                </button>
                <button
                  onClick={() => setWalletTab("manual")}
                  className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${
                    walletTab === "manual" ? "bg-accent text-white" : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  Enter Manually
                </button>
              </div>

              {/* Saved wallet tab */}
              {walletTab === "saved" && (
                <div>
                  {walletsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    </div>
                  ) : wallets.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-text-muted">No saved wallets yet</p>
                      <Link href="/dashboard/settings" className="text-xs text-accent hover:underline mt-1 inline-block">
                        Add a wallet in Settings
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {wallets.map((w) => {
                        const isSelected = selectedWalletId === w.id;
                        return (
                          <button
                            key={w.id}
                            onClick={() => setSelectedWalletId(w.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              isSelected
                                ? "border-accent bg-accent/5"
                                : "border-border-default hover:border-border-default/80"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <NetworkBadge network={w.network} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-secondary font-medium truncate">{w.label}</p>
                                <p className="text-xs text-text-muted font-mono truncate">{truncateAddress(w.wallet_address)}</p>
                              </div>
                              {isSelected && (
                                <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Manual entry tab */}
              {walletTab === "manual" && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>Blockchain Network</label>
                    <Select
                      options={NETWORKS.map((n) => ({ value: n, label: n }))}
                      value={manualNetwork}
                      onChange={(v) => { setManualNetwork(v); setAddressError(null); setAddressWarning(null); }}
                      placeholder="Select network"
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Wallet Address</label>
                    <input
                      type="text"
                      value={manualAddress}
                      onChange={(e) => { setManualAddress(e.target.value); setAddressError(null); setAddressWarning(null); }}
                      onBlur={validateManualAddress}
                      placeholder="Enter wallet address"
                      className={`${inputClasses} font-mono text-xs ${addressError ? "border-red-500/50" : ""}`}
                    />
                    {manualNetwork && WALLET_VALIDATORS[manualNetwork] && (
                      <p className="text-xs text-text-muted mt-1">{WALLET_VALIDATORS[manualNetwork].hint}</p>
                    )}
                    {addressError && <p className="text-xs text-red-400 mt-1">{addressError}</p>}
                    {addressWarning && <p className="text-xs text-amber-400 mt-1">⚠ {addressWarning}</p>}
                  </div>
                  <div>
                    <label className={labelClasses}>Memo / Tag <span className="text-text-phantom">(optional)</span></label>
                    <input
                      type="text"
                      value={manualMemo}
                      onChange={(e) => setManualMemo(e.target.value)}
                      placeholder="Memo or destination tag"
                      className={inputClasses}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Continue button */}
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="mt-6 w-full py-3 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </motion.div>
        )}

        {/* ──────────────────── STEP 2 — Review ──────────────────── */}
        {step === "review" && (
          <motion.div key="review" custom={stepDirection} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
            <h1 className="text-xl font-semibold text-text-secondary">Review Your Purchase</h1>
            <p className="text-sm text-text-muted mt-0.5 mb-6">Please review your transaction details before confirming</p>

            {/* Transaction Summary */}
            <div className={cardClasses}>
              <h2 className="text-sm font-semibold text-text-secondary mb-3">Transaction Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Purchase Amount</span>
                  <span className="text-text-secondary">${numAmount.toFixed(2)} USD</span>
                </div>
                {feeAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Handling Fee ({platformFee}%)</span>
                    <span className="text-amber-400">${feeAmount.toFixed(2)} USD</span>
                  </div>
                )}
                <div className="border-t border-border-default/30 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-secondary">Total Charged</span>
                    <span className="text-lg font-bold text-text-secondary">${totalAmount.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Destination Wallet */}
            <div className={`${cardClasses} mt-4`}>
              <h2 className="text-sm font-semibold text-text-secondary mb-3">Destination Wallet</h2>
              <div className="flex items-center gap-3">
                <NetworkBadge network={effectiveNetwork} />
                <span className="text-sm text-text-secondary font-medium">{effectiveLabel || "Manual Entry"}</span>
              </div>
              <p className="mt-2 text-xs font-mono text-text-muted break-all select-all bg-fill-subtle/30 rounded-md px-3 py-2">
                {effectiveAddress}
              </p>
              {effectiveMemo && (
                <p className="mt-2 text-xs text-text-muted">
                  Memo: <span className="text-text-secondary">{effectiveMemo}</span>
                </p>
              )}
            </div>

            {/* What happens next */}
            <div className={`${cardClasses} mt-4 border-blue-500/20`}>
              <div className="flex gap-2.5">
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-xs text-text-muted leading-relaxed">
                  After payment is confirmed, our team will remit the equivalent value in USDT or USDC to your
                  specified wallet address within 1-3 business days. You will receive an email confirmation.
                </p>
              </div>
            </div>

            {/* Error */}
            {submitError && (
              <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400">{submitError}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 text-sm font-medium text-text-muted border border-border-default rounded-lg hover:bg-fill-subtle/50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={preparing}
                className="flex-1 py-3 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {preparing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Confirm & Pay"
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ──────────────────── STEP 2.5 — Payment ──────────────────── */}
        {step === "payment" && clientSecret && (
          <motion.div key="payment" custom={stepDirection} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
            <h1 className="text-xl font-semibold text-text-secondary">Complete Payment</h1>
            <p className="text-sm text-text-muted mt-0.5 mb-6">Complete your payment to confirm the purchase.</p>

            {/* Compact summary (from /prepare response) */}
            <div className={cardClasses}>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Amount</span>
                  <span className="text-text-secondary">${preparedAmount || numAmount.toFixed(2)}</span>
                </div>
                {(preparedFeeAmount && parseFloat(preparedFeeAmount) > 0) && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Fee</span>
                    <span className="text-amber-400">${preparedFeeAmount}</span>
                  </div>
                )}
                <div className="border-t border-border-default/30 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-secondary">Total</span>
                    <span className="text-base font-bold text-text-secondary">${preparedTotalAmount || totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment form */}
            <div className="mt-4">
              <PaymentForm
                key={paymentFormKey}
                clientSecret={clientSecret}
                amount={parseFloat(preparedTotalAmount || totalAmount.toFixed(2))}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>

            {/* Payment error */}
            {paymentError && (
              <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400 mb-2">{paymentError}</p>
                <button
                  onClick={handleTryAgain}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Back to review */}
            <div className="mt-6 text-center">
              <button
                onClick={handleBackFromPayment}
                className="text-xs text-text-phantom hover:text-text-muted transition-colors"
              >
                ← Back to review
              </button>
            </div>
          </motion.div>
        )}

        {/* ──────────────────── STEP 3 — Success ──────────────────── */}
        {step === "success" && (
          <motion.div key="success" custom={stepDirection} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
            <div className="flex flex-col items-center text-center pt-8 pb-4">
              {/* Checkmark / Spinner */}
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-5">
                {!paymentConfirmed ? (
                  <div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                ) : processingTimeout ? (
                  <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              <h1 className="text-xl font-semibold text-text-secondary">
                {!paymentConfirmed
                  ? "Confirming Payment…"
                  : processingTimeout
                    ? "Payment Received"
                    : "Purchase Confirmed"}
              </h1>

              {preparedRefId && (
                <p className="mt-2 text-sm font-mono text-accent bg-accent/5 px-3 py-1.5 rounded-md">
                  Reference: {preparedRefId}
                </p>
              )}

              <p className="mt-4 text-sm text-text-muted max-w-sm">
                {!paymentConfirmed
                  ? "We're confirming your payment. This should only take a moment."
                  : processingTimeout
                    ? `Payment received — your purchase is being processed. Reference: ${preparedRefId}`
                    : "Payment confirmed — our team will remit your crypto within 1-3 business days."}
              </p>

              {paymentConfirmed && (
                <div className="mt-8 w-full max-w-sm flex flex-col gap-3">
                  <Link
                    href="/dashboard/crypto-purchases"
                    className="w-full py-3 text-sm font-medium text-accent border border-accent/30 rounded-lg hover:bg-accent/5 transition-colors text-center"
                  >
                    View My Purchases
                  </Link>
                  <button
                    onClick={resetAll}
                    className="w-full py-3 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    Buy More
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
