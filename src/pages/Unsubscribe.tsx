import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
      <div style={{ background: '#FFFDF5', minHeight: '100vh' }} className="relative overflow-hidden flex items-center justify-center">
        <div className="relative z-10 text-center px-6 max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>Invalid Link</h1>
          <p style={{ color: '#9a8578' }}>
            This unsubscribe link appears to be invalid. Please use the link from your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#FFFDF5', minHeight: '100vh' }} className="relative overflow-hidden flex items-center justify-center">

      <div className="relative z-10 text-center px-6 max-w-md">
        <div className="p-8" style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }}>
          {status === "loading" || isProcessing ? (
            <>
              <Mail className="w-16 h-16 mx-auto mb-4 animate-pulse" style={{ color: '#c4a265' }} />
              <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>Processing...</h1>
              <p style={{ color: '#9a8578' }}>
                We're updating your email preferences.
              </p>
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>You're Unsubscribed</h1>
              <p className="mb-6" style={{ color: '#9a8578' }}>
                We've removed {email} from our mailing list. You won't receive any more emails from us.
              </p>
              <p className="text-sm mb-6" style={{ color: '#9a8578' }}>
                Changed your mind? You can always start a new cosmic journey at any time.
              </p>
              <button
                onClick={() => window.location.href = "/"}
                className="px-6 py-3 font-medium transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
              >
                Return Home
              </button>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}>Something Went Wrong</h1>
              <p className="mb-6" style={{ color: '#9a8578' }}>
                We couldn't process your unsubscribe request. Please try again or contact us for help.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleUnsubscribe}
                  className="px-6 py-3 font-medium transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #c4a265, #b8973e)', color: 'white', border: 'none', borderRadius: '10px' }}
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = "/contact"}
                  className="px-6 py-3 font-medium transition-opacity hover:opacity-80"
                  style={{ border: '1px solid #e8ddd0', color: '#5a4a42', borderRadius: '10px', background: 'transparent' }}
                >
                  Contact Us
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unsubscribe;
