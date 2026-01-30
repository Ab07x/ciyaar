"use client";

import { cn } from "@/lib/utils";
import { Wifi, WifiOff, RefreshCw, Server, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface StreamErrorProps {
  error: string;
  onRetry?: () => void;
  onServerChange?: () => void;
  isRetrying?: boolean;
  retryProgress?: number;
  className?: string;
}

export function StreamError({
  error,
  onRetry,
  onServerChange,
  isRetrying = false,
  retryProgress = 0,
  className
}: StreamErrorProps) {
  const [countdown, setCountdown] = useState(10);

  // Auto-retry countdown
  useEffect(() => {
    if (!isRetrying && onRetry) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onRetry();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isRetrying, onRetry]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center",
        "bg-gradient-to-b from-black/90 to-black/95 backdrop-blur-sm",
        "text-center p-6 z-20",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="max-w-md"
      >
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            {isRetrying ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw size={36} className="text-white/70" />
              </motion.div>
            ) : (
              <WifiOff size={36} className="text-red-400" />
            )}
          </div>

          {/* Progress ring when retrying */}
          {isRetrying && retryProgress > 0 && (
            <svg className="absolute inset-0 w-20 h-20 mx-auto -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#22c55e"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - retryProgress / 100)}`}
                className="transition-all duration-300"
              />
            </svg>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2">
          {isRetrying ? "Isku dayi kale..." : "Stream ma shaqeynayo"}
        </h3>

        {/* Message */}
        <p className="text-white/60 text-sm mb-6">
          {isRetrying
            ? "Waxaan isku dayeynaa inaan ku xirno stream-ka..."
            : error || "Fadlan isku day mar kale ama isticmaal server kale."}
        </p>

        {/* Progress bar when retrying */}
        {isRetrying && (
          <div className="w-full max-w-xs mx-auto mb-6">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${retryProgress}%` }}
                className="h-full bg-green-500 rounded-full"
              />
            </div>
            <p className="text-white/40 text-xs mt-2">{retryProgress}% done</p>
          </div>
        )}

        {/* Action buttons */}
        {!isRetrying && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {onServerChange && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onServerChange}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold rounded-lg transition-colors"
              >
                <Server size={18} />
                Isticmaal Server Kale
              </motion.button>
            )}

            {onRetry && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRetry}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors"
              >
                <RefreshCw size={18} />
                Isku Day ({countdown}s)
              </motion.button>
            )}
          </div>
        )}

        {/* Network tip */}
        <div className="mt-6 flex items-center justify-center gap-2 text-white/40 text-xs">
          <AlertTriangle size={14} />
          <span>Hubi in internet-kaagu shaqeynayo</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
