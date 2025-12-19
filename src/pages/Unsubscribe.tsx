import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StarfieldBackground } from "@/components/cosmic/StarfieldBackground";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { Mail, CheckCircle, XCircle } from "lucide-react";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  
  const [status, setStatus] = useState<"loading" | "success" | "error" | "already">("loading");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (email) {
      handleUnsubscribe();
    }
  }, [email]);

  const handleUnsubscribe = async () => {
    if (!email) {
      setStatus("error");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("unsubscribe", {
        body: { email },
      });

      if (error) {
        console.error("Unsubscribe error:", error);
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch (err) {
      console.error("Unsubscribe failed:", err);
      setStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        <StarfieldBackground />
        <div className="relative z-10 text-center px-6 max-w-md">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Link</h1>
          <p className="text-muted-foreground">
            This unsubscribe link appears to be invalid. Please use the link from your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      <StarfieldBackground />
      
      <div className="relative z-10 text-center px-6 max-w-md">
        {status === "loading" || isProcessing ? (
          <>
            <Mail className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Processing...</h1>
            <p className="text-muted-foreground">
              We're updating your email preferences.
            </p>
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">You're Unsubscribed</h1>
            <p className="text-muted-foreground mb-6">
              We've removed {email} from our mailing list. You won't receive any more emails from us.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Changed your mind? You can always start a new cosmic journey at any time.
            </p>
            <CosmicButton onClick={() => window.location.href = "/"}>
              Return Home
            </CosmicButton>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Something Went Wrong</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't process your unsubscribe request. Please try again or contact us for help.
            </p>
            <div className="flex gap-3 justify-center">
              <CosmicButton onClick={handleUnsubscribe}>
                Try Again
              </CosmicButton>
              <CosmicButton variant="secondary" onClick={() => window.location.href = "/contact"}>
                Contact Us
              </CosmicButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
