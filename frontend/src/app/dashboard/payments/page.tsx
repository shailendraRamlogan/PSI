"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-store";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "TTD", symbol: "TT$", name: "Trinidad Dollar" },
  { code: "JMD", symbol: "J$", name: "Jamaican Dollar" },
  { code: "BSD", symbol: "B$", name: "Bahamian Dollar" },
];

const PAYMENT_METHODS = [
  {
    id: "card",
    label: "Credit / Debit Card",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    desc: "Visa, Mastercard",
  },
  {
    id: "bank",
    label: "Bank Transfer",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
    desc: "ACH, Wire",
  },
  {
    id: "crypto",
    label: "Cryptocurrency",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    desc: "BTC, ETH, USDT, USDC",
  },
];

type Step = "details" | "confirm" | "processing" | "success";

export default function PaymentPage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [method, setMethod] = useState("card");
  const [recipient, setRecipient] = useState("");
  const [reference, setReference] = useState("");
  const [step, setStep] = useState<Step>("details");
  const [error, setError] = useState("");

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency)!;

  const numericAmount = parseFloat(amount) || 0;
  const canProceed = numericAmount > 0 && recipient.trim().length > 0;

  const handleSubmit = () => {
    if (!canProceed) return;
    setError("");
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setStep("processing");
    // Simulate processing — Stripe integration will go here
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setStep("success");
  };

  const handleReset = () => {
    setAmount("");
    setRecipient("");
    setReference("");
    setStep("details");
    setError("");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {/* ───── Step: Details ───── */}
        {step === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <h1 className="text-xl font-bold">Send Payment</h1>
              <p className="text-text-dim text-sm mt-1">
                Transfer funds to any recipient across supported jurisdictions.
              </p>
            </div>

            <div className="space-y-5">
              {/* Amount */}
              <div>
                <label className="block text-[13px] text-text-muted mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint text-lg font-medium">
                    {selectedCurrency.symbol}
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full bg-fill-faint border border-border-medium rounded-xl pl-12 pr-24 py-4 text-2xl font-semibold text-white placeholder:text-text-void focus:outline-none focus:border-border-accent-focus focus:ring-1 focus:ring-accent/25 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-fill-subtle border border-border-medium rounded-lg px-3 py-1.5 text-[13px] text-text-secondary font-medium focus:outline-none cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-surface-2 text-white">
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-[13px] text-text-muted mb-1.5">Recipient</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Email or account ID"
                  className="w-full bg-fill-faint border border-border-medium rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-text-ghost focus:outline-none focus:border-border-accent-focus focus:ring-1 focus:ring-accent/25 transition-colors"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[13px] text-text-muted mb-2">Payment method</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => setMethod(pm.id)}
                      className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all ${
                        method === pm.id
                          ? "bg-accent-fill border-border-accent-hover text-white"
                          : "bg-fill-ghost border-border-default text-text-muted hover:bg-fill-faint hover:border-border-strong"
                      }`}
                    >
                      <div className={`flex items-center gap-2 ${method === pm.id ? "text-accent" : "text-text-dim"}`}>
                        {pm.icon}
                      </div>
                      <span className="text-[13px] font-medium">{pm.label}</span>
                      <span className="text-[11px] text-text-faint">{pm.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-[13px] text-text-muted mb-1.5">
                  Reference <span className="text-text-ghost">(optional)</span>
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Invoice #, description, etc."
                  className="w-full bg-fill-faint border border-border-medium rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-text-ghost focus:outline-none focus:border-border-accent-focus focus:ring-1 focus:ring-accent/25 transition-colors"
                />
              </div>

              {error && <p className="text-red-400 text-[13px]">{error}</p>}

              {/* Submit */}
              <motion.button
                onClick={handleSubmit}
                disabled={!canProceed}
                whileHover={canProceed ? { scale: 1.01, y: -1 } : {}}
                whileTap={canProceed ? { scale: 0.99 } : {}}
                className="w-full px-6 py-3.5 rounded-full text-[15px] font-semibold text-white bg-accent shadow-accent hover:shadow-accent-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ───── Step: Confirm ───── */}
        {step === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <h1 className="text-xl font-bold">Confirm Payment</h1>
              <p className="text-text-dim text-sm mt-1">Review the details below before proceeding.</p>
            </div>

            <div className="bg-fill-ghost border border-border-medium rounded-xl divide-y divide-border-default">
              <div className="px-5 py-4 flex justify-between items-center">
                <span className="text-[13px] text-text-dim">Amount</span>
                <span className="text-lg font-bold">
                  {selectedCurrency.symbol}{numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-text-dim text-sm ml-1">{currency}</span>
                </span>
              </div>
              <div className="px-5 py-4 flex justify-between items-center">
                <span className="text-[13px] text-text-dim">Recipient</span>
                <span className="text-[14px] font-medium">{recipient}</span>
              </div>
              <div className="px-5 py-4 flex justify-between items-center">
                <span className="text-[13px] text-text-dim">Payment method</span>
                <span className="text-[14px] font-medium">
                  {PAYMENT_METHODS.find((pm) => pm.id === method)?.label}
                </span>
              </div>
              {reference && (
                <div className="px-5 py-4 flex justify-between items-center">
                  <span className="text-[13px] text-text-dim">Reference</span>
                  <span className="text-[14px] text-text-secondary">{reference}</span>
                </div>
              )}
              <div className="px-5 py-4 flex justify-between items-center">
                <span className="text-[13px] text-text-dim">Fee</span>
                <span className="text-[14px] text-emerald-400 font-medium">Free</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep("details")}
                className="flex-1 px-6 py-3 rounded-full text-[14px] font-medium text-text-dim bg-fill-faint border border-border-medium hover:bg-fill-subtle transition-all"
              >
                Back
              </button>
              <motion.button
                onClick={handleConfirm}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                className="flex-1 px-6 py-3 rounded-full text-[15px] font-semibold text-white bg-accent shadow-accent hover:shadow-accent-lg transition-all"
              >
                Confirm & Pay
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ───── Step: Processing ───── */}
        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent-fill flex items-center justify-center mb-5">
              <svg className="animate-spin h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold">Processing payment…</h2>
            <p className="text-text-dim text-sm mt-2">
              Sending {selectedCurrency.symbol}{numericAmount.toFixed(2)} {currency} to {recipient}
            </p>
          </motion.div>
        )}

        {/* ───── Step: Success ───── */}
        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-success-fill flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-emerald-400">Payment sent!</h2>
            <p className="text-text-dim text-sm mt-2 text-center max-w-[320px]">
              {selectedCurrency.symbol}{numericAmount.toFixed(2)} {currency} has been sent to {recipient}
            </p>

            {/* Mock receipt card */}
            <div className="mt-6 w-full max-w-sm bg-fill-ghost border border-border-medium rounded-xl px-5 py-4">
              <div className="flex justify-between text-[13px]">
                <span className="text-text-dim">Transaction ID</span>
                <span className="text-text-secondary font-mono">TXN-{Date.now().toString(36).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-[13px] mt-2">
                <span className="text-text-dim">Status</span>
                <span className="text-emerald-400 font-medium">Completed</span>
              </div>
            </div>

            <motion.button
              onClick={handleReset}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 px-8 py-3 rounded-full text-[14px] font-semibold text-white bg-accent shadow-accent transition-all"
            >
              Send another payment
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
