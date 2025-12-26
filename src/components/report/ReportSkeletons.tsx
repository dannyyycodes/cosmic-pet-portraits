import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export function HeroSkeleton() {
  return (
    <div className="relative min-h-[60vh] flex flex-col items-center justify-center px-6 py-12">
      {/* Background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      
      <div className="relative z-10 text-center space-y-6">
        {/* Portrait skeleton */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto"
        >
          <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-full mx-auto" />
        </motion.div>
        
        {/* Title skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-8 md:h-10 w-64 mx-auto" />
          <Skeleton className="h-5 w-48 mx-auto" />
        </div>
        
        {/* Zodiac badges skeleton */}
        <div className="flex gap-3 justify-center">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SectionSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-8"
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="h-6 w-40" />
      </div>
      
      {/* Content lines */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Tip box skeleton */}
      <div className="mt-6 p-4 rounded-xl bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3 mt-2" />
      </div>
    </motion.div>
  );
}

export function ChartWheelSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Skeleton className="w-64 h-64 md:w-80 md:h-80 rounded-full" />
      <div className="mt-6 flex gap-4 justify-center">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function CompatibilitySkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-36" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LuckyElementsSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="h-6 w-36" />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center p-4 rounded-xl bg-muted/20">
            <Skeleton className="w-8 h-8 rounded-full mx-auto mb-2" />
            <Skeleton className="h-4 w-16 mx-auto mb-1" />
            <Skeleton className="h-5 w-12 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSkeleton />
      
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Navigation pills skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full flex-shrink-0" />
          ))}
        </div>
        
        {/* Main sections */}
        <SectionSkeleton index={0} />
        <SectionSkeleton index={1} />
        <ChartWheelSkeleton />
        <SectionSkeleton index={2} />
        <CompatibilitySkeleton />
        <LuckyElementsSkeleton />
      </div>
    </div>
  );
}
