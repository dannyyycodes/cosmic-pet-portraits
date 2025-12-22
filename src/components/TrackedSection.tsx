import { useEffect, useRef } from 'react';

interface TrackedSectionProps {
  sectionName: string;
  onView: (sectionName: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const TrackedSection = ({ sectionName, onView, children, className }: TrackedSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            hasTracked.current = true;
            onView(sectionName);
          }
        });
      },
      { threshold: 0.3 } // Trigger when 30% visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [sectionName, onView]);

  return (
    <div ref={sectionRef} className={className} data-section={sectionName}>
      {children}
    </div>
  );
};
