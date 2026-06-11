"use client";

import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onError: (message: string) => void;
}

function PaymentFormInner({ amount, onSuccess, onError }: Omit<PaymentFormProps, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    setProcessing(false);

    if (error) {
      onError(error.message || "Payment failed");
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-3 rounded-lg text-sm font-semibold bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <svg className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing…
          </>
        ) : (
          <>Pay ${amount.toFixed(2)}</>
        )}
      </button>
    </form>
  );
}

export default function PaymentForm({ clientSecret, amount, onSuccess, onError }: PaymentFormProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#20aab6",
            colorBackground: "#0f1117",
            colorText: "#ffffff",
            colorDanger: "#ef4444",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            borderRadius: "8px",
            colorTextSecondary: "#8b8fa3",
          },
          rules: {
            ".Label": {
              fontSize: "14px",
              fontWeight: "500",
              color: "#8b8fa3",
            },
            ".Input": {
              fontSize: "14px",
              color: "#ffffff",
            },
            ".Input:focus": {
              borderColor: "#20aab6",
              boxShadow: "0 0 0 2px rgba(32, 170, 182, 0.2)",
            },
          },
        },
      }}
    >
      <PaymentFormInner amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
