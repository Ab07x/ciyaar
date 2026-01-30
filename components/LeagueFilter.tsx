"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";

interface League {
  id: string;
  name: string;
  logo?: string;
  count?: number;
}

interface LeagueFilterProps {
  leagues: League[];
  selectedLeague: string | null;
  onSelectLeague: (leagueId: string | null) => void;
  className?: string;
}

const defaultLeagues: League[] = [
  { id: "all", name: "All", count: 0 },
  { id: "premier-league", name: "Premier League", logo: "/leagues/premier-league.png" },
  { id: "la-liga", name: "La Liga", logo: "/leagues/la-liga.png" },
  { id: "serie-a", name: "Serie A", logo: "/leagues/serie-a.png" },
  { id: "bundesliga", name: "Bundesliga", logo: "/leagues/bundesliga.png" },
  { id: "champions-league", name: "Champions League", logo: "/leagues/champions-league.png" },
  { id: "europa-league", name: "Europa League", logo: "/leagues/europa-league.png" },
];

export function LeagueFilter({
  leagues = defaultLeagues,
  selectedLeague,
  onSelectLeague,
  className
}: LeagueFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showMore, setShowMore] = useState(false);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2"
      >
        {leagues.map((league) => {
          const isSelected = selectedLeague === league.id || (league.id === "all" && !selectedLeague);

          return (
            <motion.button
              key={league.id}
              onClick={() => onSelectLeague(league.id === "all" ? null : league.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                "border",
                isSelected
                  ? "bg-white text-black border-white"
                  : "bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:bg-white/10"
              )}
            >
              {league.logo ? (
                <div className="w-5 h-5 relative flex-shrink-0">
                  <Image
                    src={league.logo}
                    alt={league.name}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      // Hide broken images
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : league.id !== "all" ? (
                <Trophy size={14} className="text-yellow-500 flex-shrink-0" />
              ) : null}
              <span>{league.name}</span>
              {typeof league.count === "number" && league.count > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 text-xs rounded-full",
                  isSelected ? "bg-black/20 text-black" : "bg-white/10 text-white/50"
                )}>
                  {league.count}
                </span>
              )}
            </motion.button>
          );
        })}

        {/* More dropdown trigger */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={cn(
            "flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
            "bg-white/5 text-white/70 border border-white/10 hover:border-white/30 hover:bg-white/10"
          )}
        >
          More
          <ChevronDown size={14} className={cn("transition-transform", showMore && "rotate-180")} />
        </button>
      </div>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none" />
    </div>
  );
}
