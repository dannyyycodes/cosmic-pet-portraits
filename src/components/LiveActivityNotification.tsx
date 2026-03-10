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
          className="fixed left-4 z-40 max-w-xs"
          style={{ bottom: "calc(70px + env(safe-area-inset-bottom, 0px))" }}
        >
          <div style={{ background: "rgba(255,253,245,0.97)", backdropFilter: "blur(10px)", border: "1px solid #f3eadb", borderRadius: 14, padding: "12px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontFamily: "Cormorant, Georgia, serif" }}>
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, rgba(191,82,74,0.12), rgba(196,162,101,0.12))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #f3eadb" }}>
                <Sparkles className="w-4 h-4" style={{ color: "#bf524a" }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: "0.85rem", color: "#1f1c18", fontWeight: 500, lineHeight: 1.35 }}>
                  <span style={{ fontWeight: 700 }}>{currentActivity.name}</span> from {currentActivity.location} just ordered{" "}
                  <span style={{ color: "#bf524a", fontWeight: 700 }}>{currentActivity.petName}'s</span> soul reading
                </p>
                <p style={{ fontSize: "0.72rem", color: "#958779", marginTop: 3 }}>{time}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
