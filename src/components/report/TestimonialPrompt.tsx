import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, Send, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestimonialPromptProps {
  reportId: string;
  petName: string;
  species: string;
  email: string;
  onClose: () => void;
}

const FAVORITE_FEATURES = [
  "Personality insights",
  "Birth chart analysis",
  "Photo card",
  "Compatibility section",
  "Weekly horoscopes",
  "The cosmic theme",
];

export const TestimonialPrompt = ({
  reportId,
  petName,
  species,
  email,
  onClose,
}: TestimonialPromptProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [improvementFeedback, setImprovementFeedback] = useState("");
  const [favoriteFeature, setFavoriteFeature] = useState("");
  const [photoConsent, setPhotoConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    // Check if already submitted for this report
    const submitted = localStorage.getItem(`testimonial_submitted_${reportId}`);
    if (submitted) {
      setHasSubmitted(true);
    }
  }, [reportId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("testimonials").insert({
        report_id: reportId,
        email,
        pet_name: petName,
        species,
        rating,
        review_text: reviewText || null,
        would_recommend: wouldRecommend,
        improvement_feedback: improvementFeedback || null,
        favorite_feature: favoriteFeature || null,
        photo_consent: photoConsent,
      });

      if (error) throw error;

      localStorage.setItem(`testimonial_submitted_${reportId}`, "true");
      toast.success("Thank you for your feedback! 🌟");
      onClose();
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-gradient-to-br from-cosmic-dark via-cosmic-purple/20 to-cosmic-dark border border-cosmic-gold/30 rounded-2xl p-6 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-cosmic-gold/60 hover:text-cosmic-gold transition-colors"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <Sparkles className="w-8 h-8 text-cosmic-gold animate-pulse" />
            </div>
            <h2 className="text-2xl font-display text-cosmic-gold mb-2">
              How was {petName}'s reading?
            </h2>
            <p className="text-cosmic-light/70 text-sm">
              Your feedback helps us create better cosmic experiences
            </p>
          </div>

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Star Rating */}
              <div className="text-center">
                <p className="text-cosmic-light/80 mb-3 text-sm">
                  Rate your experience
                </p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={36}
                        className={`transition-colors ${
                          star <= (hoveredRating || rating)
                            ? "fill-cosmic-gold text-cosmic-gold"
                            : "text-cosmic-gold/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-cosmic-gold mt-2 text-sm">
                    {rating === 5 && "Amazing! ✨"}
                    {rating === 4 && "Great! 🌟"}
                    {rating === 3 && "Good 👍"}
                    {rating === 2 && "Could be better"}
                    {rating === 1 && "We'll improve!"}
                  </p>
                )}
              </div>

              {/* Favorite Feature */}
              <div>
                <p className="text-cosmic-light/80 mb-3 text-sm">
                  What was your favorite part?
                </p>
                <div className="flex flex-wrap gap-2">
                  {FAVORITE_FEATURES.map((feature) => (
                    <button
                      key={feature}
                      onClick={() => setFavoriteFeature(feature)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                        favoriteFeature === feature
                          ? "bg-cosmic-gold/20 border-cosmic-gold text-cosmic-gold"
                          : "border-cosmic-gold/30 text-cosmic-light/60 hover:border-cosmic-gold/50"
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommend */}
              <div className="flex items-center justify-center gap-3">
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    wouldRecommend
                      ? "fill-pink-500 text-pink-500"
                      : "text-cosmic-light/40"
                  }`}
                />
                <span className="text-cosmic-light/80 text-sm">
                  Would you recommend us to friends?
                </span>
                <button
                  onClick={() => setWouldRecommend(!wouldRecommend)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                    wouldRecommend
                      ? "bg-pink-500/20 border-pink-500 text-pink-400"
                      : "border-cosmic-light/30 text-cosmic-light/50"
                  }`}
                >
                  {wouldRecommend ? "Yes!" : "Maybe"}
                </button>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={rating === 0}
                className="w-full bg-cosmic-gold text-cosmic-dark hover:bg-cosmic-gold/90"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Review Text */}
              <div>
                <label className="text-cosmic-light/80 text-sm block mb-2">
                  Tell us more about your experience (optional)
                </label>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={`What did you love about ${petName}'s cosmic reading?`}
                  className="bg-cosmic-dark/50 border-cosmic-gold/30 text-cosmic-light placeholder:text-cosmic-light/40 resize-none"
                  rows={3}
                />
              </div>

              {/* Improvement Feedback */}
              <div>
                <label className="text-cosmic-light/80 text-sm block mb-2">
                  How can we improve? (optional)
                </label>
                <Textarea
                  value={improvementFeedback}
                  onChange={(e) => setImprovementFeedback(e.target.value)}
                  placeholder="Any features you'd like to see? Things that could be better?"
                  className="bg-cosmic-dark/50 border-cosmic-gold/30 text-cosmic-light placeholder:text-cosmic-light/40 resize-none"
                  rows={2}
                />
              </div>

              {/* Photo Consent */}
              {reviewText && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-cosmic-gold/5 border border-cosmic-gold/20">
                  <Checkbox
                    id="photoConsent"
                    checked={photoConsent}
                    onCheckedChange={(checked) =>
                      setPhotoConsent(checked as boolean)
                    }
                    className="mt-0.5 border-cosmic-gold/50 data-[state=checked]:bg-cosmic-gold data-[state=checked]:border-cosmic-gold"
                  />
                  <label
                    htmlFor="photoConsent"
                    className="text-cosmic-light/70 text-xs cursor-pointer"
                  >
                    I give permission to use my review and {petName}'s photo on
                    the website (we'll reach out first!)
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-cosmic-gold/30 text-cosmic-gold hover:bg-cosmic-gold/10"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-cosmic-gold text-cosmic-dark hover:bg-cosmic-gold/90"
                >
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Skip option */}
          <button
            onClick={onClose}
            className="w-full mt-4 text-cosmic-light/40 text-xs hover:text-cosmic-light/60 transition-colors"
          >
            Maybe later
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
