
"use client";

import { useState } from "react";
import {
  Check,
  X,
  Sparkles,
  Crown,
  Zap,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "@/services/api";

// ========================================
// PRICING PLANS
// ========================================

const plans = [
  {
    name: "Free",
    planId: "free",
    icon: Zap,
    description: "Perfect for getting started",
    monthlyPrice: "[PRICE]",
    yearlyPrice: "[PRICE]",
    features: [
      { text: "Up to 10 members", included: true },
      { text: "3 active projects", included: true },
      { text: "Basic roles", included: true },
      { text: "Limited AI credits", included: true },
      { text: "Custom roles", included: false },
      { text: "Analytics", included: false },
    ],
    current: true,
  },
  {
    name: "Pro",
    planId: "pro",
    icon: Crown,
    description: "For growing teams and businesses",
    monthlyPrice: "[PRICE]",
    yearlyPrice: "[PRICE]",
    features: [
      { text: "Unlimited projects", included: true },
      { text: "Custom roles and permissions", included: true },
      { text: "More AI credits", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Audit log", included: false },
    ],
    popular: true,
  },
  {
    name: "Business",
    planId: "business",
    icon: ShieldCheck,
    description: "Advanced tools for larger teams",
    monthlyPrice: "[PRICE]",
    yearlyPrice: "[PRICE]",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Audit log", included: true },
      { text: "Priority support", included: true },
      { text: "Bring your own LLM key", included: true },
    ],
  },
];

// ========================================
// RAZORPAY SCRIPT LOADER
// ========================================

const RAZORPAY_SCRIPT =
  "https://checkout.razorpay.com/v1/checkout.js";

let razorpayScriptPromise = null;

const loadRazorpayScript = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");

    script.src = RAZORPAY_SCRIPT;
    script.async = true;

    script.onload = () => {
      resolve(Boolean(window.Razorpay));
    };

    script.onerror = () => {
      razorpayScriptPromise = null;
      resolve(false);
    };

    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};

// ========================================
// UPGRADE PAGE
// ========================================

export default function UpgradePage() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [processingPlan, setProcessingPlan] = useState(null);

  // ======================================
  // HANDLE RAZORPAY SUBSCRIPTION
  // ======================================

  const handleUpgrade = async (plan) => {
    if (processingPlan) return;

    if (!plan?.planId || !["pro", "business"].includes(plan.planId)) {
      toast.error("Please select a valid paid plan.");
      return;
    }

    try {
      setProcessingPlan(plan.planId);

      // Step 1: Load Razorpay Checkout
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout.");
      }

      // Step 2: Prepare request data
      const requestData = {
        plan: plan.planId,
        billingCycle,
      };

      console.log("Selected plan:", plan);
      console.log("Sending billing data:", requestData);

      // Step 3: Create subscription through backend
      const response = await API.post(
        "/organizations/billing/subscription",
        requestData
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to create subscription."
        );
      }

      const subscriptionData = response.data.data;

      if (
        !subscriptionData?.subscriptionId ||
        !subscriptionData?.keyId
      ) {
        throw new Error(
          "Invalid Razorpay subscription details received."
        );
      }

      // Step 4: Configure Razorpay Checkout
      const options = {
        key: subscriptionData.keyId,

        subscription_id: subscriptionData.subscriptionId,

        name: "TaskFlow",

        description: `${plan.name} - ${billingCycle} subscription`,

        theme: {
          color: "#5145EC",
        },

        handler: function (paymentResponse) {
          console.log(
            "Razorpay authorization response:",
            paymentResponse
          );

          setProcessingPlan(null);

          toast.info(
            "Payment authorized. Server verification is still required."
          );

          // Do not activate the plan here.
          // The backend must verify the Razorpay signature.
        },

        modal: {
          ondismiss: function () {
            setProcessingPlan(null);
            toast.info("Payment window closed.");
          },
        },
      };

      // Step 5: Open Razorpay Checkout
      const razorpayCheckout = new window.Razorpay(options);

      razorpayCheckout.on("payment.failed", function (paymentResponse) {
        console.error(
          "Razorpay payment failed:",
          paymentResponse.error
        );

        setProcessingPlan(null);

        toast.error(
          paymentResponse.error?.description ||
            "Payment failed. Please try again."
        );
      });

      razorpayCheckout.open();

    } catch (error) {
      console.error("Razorpay subscription error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to start subscription."
      );

      setProcessingPlan(null);
    }
  };

  // ======================================
  // PAGE UI
  // ======================================

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* PAGE HEADING */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
              <Sparkles size={21} />
            </div>

            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              TASKFLOW PLANS
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Upgrade your plan
          </h1>

          <p className="text-sm text-muted-foreground sm:text-base">
            Pick the plan that fits your company size and unlock more
            possibilities.
          </p>
        </div>

        {/* BILLING TOGGLE */}
        <div className="flex justify-center">
          <div className="inline-flex items-center rounded-xl bg-muted p-1">
            <button
              type="button"
              disabled={!!processingPlan}
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-card text-indigo-600 shadow-sm dark:text-indigo-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>

            <button
              type="button"
              disabled={!!processingPlan}
              onClick={() => setBillingCycle("yearly")}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                billingCycle === "yearly"
                  ? "bg-card text-indigo-600 shadow-sm dark:text-indigo-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly

              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-400">
                Save more
              </span>
            </button>
          </div>
        </div>

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;

            const price =
              billingCycle === "monthly"
                ? plan.monthlyPrice
                : plan.yearlyPrice;

            const isProcessing =
              processingPlan === plan.planId;

            return (
              <div
                key={plan.planId}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  plan.popular
                    ? "border-2 border-indigo-600 shadow-lg shadow-indigo-500/10"
                    : "border-border shadow-sm"
                }`}
              >
                {/* POPULAR BADGE */}
                {plan.popular && (
                  <div className="absolute -top-3 right-5">
                    <span className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md">
                      Most popular
                    </span>
                  </div>
                )}

                {/* PLAN HEADER */}
                <div className="mb-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                    <Icon size={22} />
                  </div>

                  <h2 className="text-xl font-bold">
                    {plan.name}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                {/* PRICE */}
                <div className="mb-6 border-b border-border pb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">
                      {price}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    per member /{" "}
                    {billingCycle === "monthly" ? "month" : "year"}
                  </p>
                </div>

                {/* FEATURES */}
                <div className="flex-1 space-y-4">
                  <p className="text-sm font-semibold">
                    What's included
                  </p>

                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          feature.included
                            ? "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {feature.included ? (
                          <Check size={13} strokeWidth={3} />
                        ) : (
                          <X size={13} strokeWidth={2.5} />
                        )}
                      </span>

                      <span
                        className={`text-sm ${
                          feature.included
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ACTION BUTTON */}
                <div className="mt-8">
                  {plan.current ? (
                    <button
                      type="button"
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-border bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground"
                    >
                      Current plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpgrade(plan)}
                      disabled={!!processingPlan}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                        plan.popular
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700"
                          : "border border-border bg-card text-foreground hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={17} className="animate-spin" />
                          Preparing checkout...
                        </>
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
              <ShieldCheck size={19} />
            </div>

            <div>
              <p className="text-sm font-semibold">
                Simple and transparent pricing
              </p>

              <p className="text-xs text-muted-foreground">
                Choose a plan that works for your organization.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Secure subscription checkout powered by Razorpay.
          </p>
        </div>

      </div>
    </div>
  );
}
