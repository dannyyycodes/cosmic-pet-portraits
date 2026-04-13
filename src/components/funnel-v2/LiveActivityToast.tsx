import { useEffect, useState } from "react";

/**
 * Live activity toast — rotating floating notifications, bottom-left.
 *
 * Creates a strong "this is alive, people are buying right now"
 * momentum signal. Shows one notification at a time, auto-rotates
 * every 7 seconds, dismissible, only shows after the hero scrolls
 * past.
 *
 * The activity entries are curated from realistic recent-customer
 * patterns (first name + UK/US/Aus city + breed). Once a backend
 * /api/recent-activity endpoint exists this should swap to a live
 * feed — the shape of each entry will stay the same.
 *
 * Entries rotate in randomized order each session so no two visits
 * look identical.
 */

type Activity = {
  name: string;
  location: string;
  pet: string;
  image: string; // /public/live-activity/{image}, sourced from dog.ceo + thecatapi
  minutesAgo: number;
};

// 25 fresh images live at /public/live-activity/pet-01..25.jpg (15 dogs
// via dog.ceo + 10 cats via thecatapi). Zero overlap with the breed
// images used in CompactReviews. Re-run scripts/fetch-live-activity-pets.cjs
// to refresh the pool.
const POOL: Activity[] = [
  { name: "Emma", location: "London", pet: "Luna", image: "pet-01.jpg", minutesAgo: 2 },
  { name: "James", location: "Dublin", pet: "Bear", image: "pet-02.jpg", minutesAgo: 4 },
  { name: "Sophie", location: "Manchester", pet: "Biscuit", image: "pet-03.jpg", minutesAgo: 6 },
  { name: "Michael", location: "Austin", pet: "Cooper", image: "pet-04.jpg", minutesAgo: 8 },
  { name: "Rachel", location: "Toronto", pet: "Daisy", image: "pet-05.jpg", minutesAgo: 11 },
  { name: "Tom", location: "Sydney", pet: "Rosie", image: "pet-06.jpg", minutesAgo: 13 },
  { name: "Priya", location: "Edinburgh", pet: "Milo", image: "pet-07.jpg", minutesAgo: 15 },
  { name: "Hannah", location: "Bristol", pet: "Teddy", image: "pet-08.jpg", minutesAgo: 18 },
  { name: "Olivia", location: "Denver", pet: "Maple", image: "pet-09.jpg", minutesAgo: 21 },
  { name: "Daniel", location: "Glasgow", pet: "Finn", image: "pet-10.jpg", minutesAgo: 24 },
  { name: "Ava", location: "Melbourne", pet: "Ziggy", image: "pet-11.jpg", minutesAgo: 27 },
  { name: "Noah", location: "Brighton", pet: "Pepper", image: "pet-12.jpg", minutesAgo: 31 },
  { name: "Isla", location: "Vancouver", pet: "Willow", image: "pet-13.jpg", minutesAgo: 35 },
  { name: "Ben", location: "Leeds", pet: "Scout", image: "pet-14.jpg", minutesAgo: 38 },
  { name: "Freya", location: "Portland", pet: "Nala", image: "pet-15.jpg", minutesAgo: 42 },
  { name: "Maya", location: "Wellington", pet: "Luna", image: "pet-17.jpg", minutesAgo: 52 },
  { name: "Chloe", location: "Bath", pet: "Ollie", image: "pet-18.jpg", minutesAgo: 58 },
  { name: "Leo", location: "Oxford", pet: "Poppy", image: "pet-19.jpg", minutesAgo: 64 },
  { name: "Zara", location: "Chicago", pet: "Rex", image: "pet-20.jpg", minutesAgo: 73 },
  { name: "Mia", location: "Auckland", pet: "Clover", image: "pet-21.jpg", minutesAgo: 81 },
  { name: "Jasmine", location: "Cape Town", pet: "Sage", image: "pet-23.jpg", minutesAgo: 98 },
  { name: "Oscar", location: "Amsterdam", pet: "Olive", image: "pet-24.jpg", minutesAgo: 112 },
  { name: "Ruby", location: "Barcelona", pet: "Juniper", image: "pet-25.jpg", minutesAgo: 127 },
];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const timeAgo = (min: number): string => {
  if (min < 1) return "just now";
  if (min === 1) return "1 min ago";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  return h === 1 ? "1 hour ago" : `${h} hours ago`;
};

export const LiveActivityToast = () => {
  const [queue] = useState<Activity[]>(() => shuffle(POOL));
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [scrolledIn, setScrolledIn] = useState(false);

  // Wait for user to scroll past 30% of the hero before showing first toast
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.3) {
        setScrolledIn(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Rotation lifecycle: show → hold 5s → hide → switch → show
  useEffect(() => {
    if (dismissed || !scrolledIn) return;

    const show = setTimeout(() => setVisible(true), 600);
    const hide = setTimeout(() => setVisible(false), 5800);
    const next = setTimeout(() => {
      setIndex((i) => (i + 1) % queue.length);
    }, 6400);

    return () => {
      clearTimeout(show);
      clearTimeout(hide);
      clearTimeout(next);
    };
  }, [index, dismissed, scrolledIn, queue.length]);

  if (dismissed || !scrolledIn) return null;

  const item = queue[index];

  return (
    <div
      className="fixed left-3 sm:left-5 pointer-events-none"
      style={{
        bottom: "calc(82px + env(safe-area-inset-bottom, 0px))", // clear the mobile sticky CTA
        zIndex: 45,
        maxWidth: "calc(100vw - 24px)",
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className="pointer-events-auto flex items-center gap-3 rounded-2xl shadow-lg px-3 py-2.5"
        style={{
          background: "rgba(255,253,245,0.97)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid var(--cream3, #f3eadb)",
          boxShadow: "0 10px 30px rgba(31,28,24,0.08), 0 2px 8px rgba(31,28,24,0.04)",
          minWidth: 230,
          maxWidth: 290,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 500ms ease, transform 500ms ease",
        }}
      >
        {/* Pet photo — sourced from /public/live-activity/, distinct pool from reviews */}
        <div className="relative flex-shrink-0">
          <img
            src={`/live-activity/${item.image}`}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
            style={{ border: "2px solid var(--cream, #FFFDF5)" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          {/* Live dot */}
          <span
            className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5"
            aria-hidden="true"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--green,#4a8c5c)] opacity-60" />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{
                background: "var(--green, #4a8c5c)",
                border: "1.5px solid var(--cream, #FFFDF5)",
              }}
            />
          </span>
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0">
          <p
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "0.78rem",
              color: "var(--ink, #1f1c18)",
              lineHeight: 1.25,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <strong style={{ fontWeight: 400 }}>{item.name}</strong>
            <span style={{ color: "var(--muted, #958779)", fontFamily: "Cormorant, Georgia, serif", fontWeight: 500 }}>
              {" "}from {item.location}
            </span>
          </p>
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.74rem",
              color: "var(--earth, #6e6259)",
              fontStyle: "italic",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            just revealed {item.pet}'s soul
          </p>
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.66rem",
              color: "var(--faded, #bfb2a3)",
              marginTop: 1,
            }}
          >
            {timeAgo(item.minutesAgo)}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 rounded-full transition-opacity hover:opacity-70"
          style={{ color: "var(--faded, #bfb2a3)" }}
          aria-label="Dismiss activity notification"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      </div>
    </div>
  );
};
