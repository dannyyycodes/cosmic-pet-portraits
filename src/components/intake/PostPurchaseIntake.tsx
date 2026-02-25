import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Dog, Cat, Rabbit, Bird, Fish, Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PostPurchaseIntakeProps {
  reportId: string;
  onComplete: () => void;
}

const SPECIES_OPTIONS = [
  { value: "dog", label: "Dog", icon: Dog },
  { value: "cat", label: "Cat", icon: Cat },
  { value: "rabbit", label: "Rabbit", icon: Rabbit },
  { value: "bird", label: "Bird", icon: Bird },
  { value: "fish", label: "Fish", icon: Fish },
  { value: "other", label: "Other", icon: Dog },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Boy" },
  { value: "female", label: "Girl" },
  { value: "unknown", label: "Not sure" },
];

type Step = "name" | "species" | "gender" | "dob" | "submitting";

export function PostPurchaseIntake({ reportId, onComplete }: PostPurchaseIntakeProps) {
  const [step, setStep] = useState<Step>("name");
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setStep("submitting");
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("update-pet-data", {
        body: {
          reportId,
          petName,
          species,
          gender: gender || undefined,
          birthDate: birthDate || undefined,
        },
      });

      if (error) throw error;

      // Now trigger report generation
      const { error: genError } = await supabase.functions.invoke("generate-cosmic-report", {
        body: { reportId },
      });

      if (genError) {
        console.warn("[PostPurchaseIntake] Generation trigger error (may be async):", genError);
      }

      onComplete();
    } catch (err: any) {
      console.error("[PostPurchaseIntake] Error:", err);
      toast.error("Something went wrong. Please try again.");
      setStep("dob");
      setIsSubmitting(false);
    }
  };

  const stepNumber = step === "name" ? 1 : step === "species" ? 2 : step === "gender" ? 3 : step === "dob" ? 4 : 5;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Progress */}
        <div className="flex items-center gap-1 mb-8 justify-center">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all",
                s <= stepNumber ? "bg-primary w-10" : "bg-border w-6"
              )}
            />
          ))}
        </div>

        <div className="text-center mb-2">
          <p className="text-sm text-primary font-medium">
            ✨ Payment confirmed!
          </p>
        </div>

        <h1 className="text-2xl font-serif font-bold text-foreground text-center mb-1">
          Tell us about your pet
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Just a few quick details to create their report
        </p>

        <AnimatePresence mode="wait">
          {/* Step 1: Name */}
          {step === "name" && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <label className="block text-sm font-medium text-foreground">
                What's your pet's name?
              </label>
              <Input
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="e.g. Luna, Max, Buddy..."
                className="text-lg py-6"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && petName.trim() && setStep("species")}
              />
              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!petName.trim()}
                onClick={() => setStep("species")}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Species */}
          {step === "species" && (
            <motion.div
              key="species"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <label className="block text-sm font-medium text-foreground">
                What kind of pet is {petName}?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {SPECIES_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = species === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSpecies(opt.value);
                        setTimeout(() => setStep("gender"), 300);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <Icon className={cn("w-6 h-6", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 3: Gender */}
          {step === "gender" && (
            <motion.div
              key="gender"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <label className="block text-sm font-medium text-foreground">
                Is {petName} a boy or girl?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {GENDER_OPTIONS.map((opt) => {
                  const isSelected = gender === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setGender(opt.value);
                        setTimeout(() => setStep("dob"), 300);
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 4: DOB */}
          {step === "dob" && (
            <motion.div
              key="dob"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <label className="block text-sm font-medium text-foreground">
                When was {petName} born? (approximate is fine)
              </label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="text-lg py-6"
              />
              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                Create {petName}'s Report ✨
              </Button>
              <button
                onClick={handleSubmit}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                Skip — I'm not sure
              </button>
            </motion.div>
          )}

          {/* Submitting */}
          {step === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Creating {petName}'s report...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
