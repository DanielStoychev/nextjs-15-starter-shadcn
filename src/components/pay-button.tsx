"use client";

import { useState } from "react";
import { Button } from "@/registry/new-york-v4/ui/button";
import { loadStripe } from "@stripe/stripe-js";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

console.log("🔑 NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:", process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY); // Debugging line

interface PayButtonProps {
  // priceId: string; // No longer needed as a prop, hardcoded for now
}

export function PayButton() { // Removed priceId prop
  const [loading, setLoading] = useState(false);
  const priceId = "price_1Ra5dKGWFA8n3EU5e152pg0a"; // Hardcode the new price ID

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const { sessionId, url } = await response.json();

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else if (sessionId) {
        // Fallback for client-side redirect if URL is not provided
        const stripe = await stripePromise;
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId });
        }
      } else {
        console.error("No session URL or ID received.");
        alert("Failed to initiate payment. Please try again.");
      }
    } catch (error) {
      console.error("Error initiating checkout:", error);
      alert("An error occurred during payment initiation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} className="mt-8 px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white">
      {loading ? "Processing..." : "Pay Entry Fee (£5.00)"}
    </Button>
  );
}
