import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

const activities = [
  { name: "Sarah", location: "London", petName: "Biscuit", petType: "cat" },
  { name: "Emma", location: "New York", petName: "Porkchop", petType: "dog" },
  { name: "James", location: "Sydney", petName: "Noodle", petType: "cat" },
  { name: "Olivia", location: "Toronto", petName: "Beans", petType: "dog" },
  { name: "Michael", location: "Dublin", petName: "Pickles", petType: "rabbit" },
  { name: "Sophie", location: "Paris", petName: "Nugget", petType: "cat" },
  { name: "David", location: "Berlin", petName: "Waffles", petType: "dog" },
  { name: "Priya", location: "Mumbai", petName: "Mochi", petType: "cat" },
  { name: "Carlos", location: "Madrid", petName: "Churro", petType: "dog" },
  { name: "Anna", location: "Stockholm", petName: "Sprocket", petType: "cat" },
  { name: "Tom", location: "Manchester", petName: "Turnip", petType: "dog" },
  { name: "Lisa", location: "Amsterdam", petName: "Gizmo", petType: "hamster" },
  { name: "Rachel", location: "Bristol", petName: "Crumpet", petType: "cat" },
  { name: "Jake", location: "Denver", petName: "Tater Tot", petType: "dog" },
  { name: "Mei", location: "Singapore", petName: "Dumpling", petType: "cat" },
];

const timeAgo = () => {
  const minutes = Math.floor(Math.random() * 15) + 1;
  return `${minutes} min ago`;
};

export const LiveActivityNotification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(activities[0]);
  const [time, setTime] = useState(timeAgo());

  useEffect(() => {
    // Initial delay before showing first notification
    const initialDelay = setTimeout(() => {
      showNotification();
    }, 8000);

    return () => clearTimeout(initialDelay);
  }, []);

  const showNotification = () => {
    // Pick a random activity
    const randomIndex = Math.floor(Math.random() * activities.length);
    setCurrentActivity(activities[randomIndex]);
    setTime(timeAgo());
    setIsVisible(true);

    // Hide after 4 seconds
    setTimeout(() => {
      setIsVisible(false);
      
      // Schedule next notification (random interval between 15-30 seconds)
      const nextInterval = Math.floor(Math.random() * 15000) + 15000;
      setTimeout(showNotification, nextInterval);
    }, 4000);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-20 md:bottom-6 left-4 z-40 max-w-xs"
        >
          <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-xl shadow-black/20">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-nebula-purple flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium leading-snug">
                  <span className="font-semibold">{currentActivity.name}</span> from {currentActivity.location} just ordered{" "}
                  <span className="text-primary font-semibold">{currentActivity.petName}'s</span> cosmic report
                </p>
                <p className="text-xs text-muted-foreground mt-1">{time}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
