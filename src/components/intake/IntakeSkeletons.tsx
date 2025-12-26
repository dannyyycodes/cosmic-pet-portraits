import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export function IntakeStepSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center px-4 py-8 max-w-md mx-auto space-y-6"
    >
      {/* Header section */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-8 rounded-full mx-auto" />
        <Skeleton className="h-7 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-2/3 mx-auto" />
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-3 mt-8">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>

      {/* Button */}
      <Skeleton className="h-12 w-full rounded-full mt-6" />
    </motion.div>
  );
}

export function IntakeInputSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center px-4 py-8 max-w-md mx-auto space-y-6"
    >
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-6 rounded-full mx-auto" />
        <Skeleton className="h-8 w-2/3 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>

      {/* Input field */}
      <Skeleton className="h-14 w-full rounded-xl mt-6" />

      {/* Helper text */}
      <Skeleton className="h-3 w-1/3 mx-auto" />

      {/* Button */}
      <Skeleton className="h-12 w-full rounded-full mt-4" />
    </motion.div>
  );
}

export function IntakeEmailSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-4 py-6 max-w-lg mx-auto space-y-6"
    >
      {/* Confetti placeholder */}
      <div className="flex justify-center gap-2 mb-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-3 h-3 rounded-full" />
        ))}
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>

      {/* Pet card */}
      <div className="p-4 rounded-xl bg-card/50 border border-border/30">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Soul snapshot card */}
      <div className="p-4 rounded-xl bg-card/50 border border-border/30 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      {/* Email input */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-48 mx-auto" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </motion.div>
  );
}

export function IntakeCheckoutSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-4 py-6 max-w-4xl mx-auto"
    >
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left side - Report preview */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="p-4 rounded-xl bg-card/50 border border-border/30 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          
          {/* Tier cards */}
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>

        {/* Right side - Order summary */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-36" />
          <div className="p-4 rounded-xl bg-card/50 border border-border/30 space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-12" />
            </div>
            <div className="border-t border-border/30 pt-3 flex justify-between">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
          
          <Skeleton className="h-12 w-full rounded-full" />
          
          {/* Trust badges */}
          <div className="flex justify-center gap-4">
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function IntakeProgressSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-2">
      <div className="flex items-center gap-3">
        <Skeleton className="h-1.5 flex-1 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}
