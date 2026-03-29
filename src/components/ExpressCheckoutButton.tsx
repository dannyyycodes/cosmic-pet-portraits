import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";

const stripePromise = loadStripe(
  "pk_live_51SYmd1EFEZSdxrGteVAbBwzHVGfWaw6QBy1h7muXtI6G09y9DTqNDTBDyf5W4vT79nDAmGTKqi7dni5XnperFfOB007ZYk7qKV"
);

interface Props {
  totalCents: number;
  petCount: number;
  selectedTier: string;
  includesPortrait: boolean;
  includesBook: boolean;
  occasionMode: string;
  email: string;
  onError: (msg: string) => void;
}

function CheckoutForm({
  totalCents,
  petCount,
  selectedTier,
  includesPortrait,
  includesBook,
  occasionMode,
  email,
  onError,
}: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const onConfirm = async () => {
    if (!stripe || !elements || isProcessing) return;
    setIsProcessing(true);

    try {
      // Step 1: validate elements
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(submitError.message || "Payment validation failed");
        return;
      }

      // Step 2: create PaymentIntent via backend
      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-payment-intent",
        {
          body: {
            selectedTier,
            petCount,
            includesPortrait,
            includesBook,
            occasionMode,
            ...(email.trim() ? { quickCheckoutEmail: email.trim() } : {}),
          },
        }
      );

      if (invokeError || !data?.clientSecret) {
        onError(invokeError?.message || "Failed to prepare payment");
        return;
      }

      const { clientSecret, paymentIntentId, reportId } = data as {
        clientSecret: string;
        paymentIntentId: string;
        reportId: string;
      };

      const successUrl = `/payment-success?session_id=${paymentIntentId}&report_id=${reportId}&quick=true`;

      // Step 3: confirm payment (redirect: 'if_required' keeps Apple Pay / Google Pay in-page)
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}${successUrl}`,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        onError(confirmError.message || "Payment failed");
      } else {
        navigate(successUrl);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isReady) {
    // Render but invisible while loading — avoids layout shift
    return (
      <div style={{ height: 0, overflow: "hidden" }}>
        <ExpressCheckoutElement onConfirm={onConfirm} onReady={() => setIsReady(true)} />
      </div>
    );
  }

  return (
    <ExpressCheckoutElement
      onConfirm={onConfirm}
      options={{
        buttonHeight: 56,
        buttonTheme: { applePay: "black", googlePay: "black" },
        layout: { maxColumns: 1, maxRows: 3, overflow: "never" },
      }}
    />
  );
}

export default function ExpressCheckoutButton(props: Props) {
  return (
    <Elements
      key={props.totalCents}
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount: props.totalCents,
        currency: "usd",
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#bf524a",
            borderRadius: "12px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          },
        },
      }}
    >
      <CheckoutForm {...props} />
    </Elements>
  );
}
