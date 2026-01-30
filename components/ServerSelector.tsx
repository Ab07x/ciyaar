"use client";

import { cn } from "@/lib/utils";
import { Server, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ServerInfo {
  id: number | string;
  name: string;
  label?: string;
  status?: "online" | "offline" | "slow" | "loading";
  url?: string;
}

interface ServerSelectorProps {
  servers: ServerInfo[];
  activeServer: number | string;
  onServerChange: (id: number | string) => void;
  className?: string;
  variant?: "default" | "compact" | "pills";
}

export function ServerSelector({
  servers,
  activeServer,
  onServerChange,
  className,
  variant = "default"
}: ServerSelectorProps) {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "online":
        return <CheckCircle2 size={12} className="text-green-500" />;
      case "offline":
        return <AlertCircle size={12} className="text-red-500" />;
      case "slow":
        return <AlertCircle size={12} className="text-yellow-500" />;
      case "loading":
        return <Loader2 size={12} className="text-white/50 animate-spin" />;
      default:
        return <CheckCircle2 size={12} className="text-green-500" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "online":
        return "Online";
      case "offline":
        return "Offline";
      case "slow":
        return "Slow";
      case "loading":
        return "Loading...";
      default:
        return "Online";
    }
  };

  if (variant === "pills") {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        <span className="text-white/50 text-sm font-medium mr-1">Server:</span>
        {servers.map((server) => {
          const isActive = server.id === activeServer;
          const isDisabled = server.status === "offline";

          return (
            <motion.button
              key={server.id}
              onClick={() => !isDisabled && onServerChange(server.id)}
              disabled={isDisabled}
              whileHover={{ scale: isDisabled ? 1 : 1.05 }}
              whileTap={{ scale: isDisabled ? 1 : 0.95 }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                "border",
                isActive
                  ? "bg-white text-black border-white"
                  : "bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:bg-white/10",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full",
                server.status === "online" && "bg-green-500",
                server.status === "offline" && "bg-red-500",
                server.status === "slow" && "bg-yellow-500",
                !server.status && "bg-green-500"
              )} />
              {server.name}
            </motion.button>
          );
        })}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {servers.map((server) => {
          const isActive = server.id === activeServer;
          const isDisabled = server.status === "offline";

          return (
            <button
              key={server.id}
              onClick={() => !isDisabled && onServerChange(server.id)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                isActive
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {getStatusIcon(server.status)}
              {server.name}
            </button>
          );
        })}
      </div>
    );
  }

  // Default variant - Card style
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
        <Server size={16} />
        <span>Stream Source</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {servers.map((server) => {
          const isActive = server.id === activeServer;
          const isDisabled = server.status === "offline";

          return (
            <motion.button
              key={server.id}
              onClick={() => !isDisabled && onServerChange(server.id)}
              disabled={isDisabled}
              whileHover={{ scale: isDisabled ? 1 : 1.02 }}
              whileTap={{ scale: isDisabled ? 1 : 0.98 }}
              className={cn(
                "relative flex flex-col items-start p-4 rounded-xl transition-all",
                "border text-left",
                isActive
                  ? "bg-white/10 border-white/30 shadow-lg"
                  : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeServer"
                  className="absolute inset-0 rounded-xl border-2 border-green-500 pointer-events-none"
                />
              )}

              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  {isActive ? (
                    <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  ) : (
                    <div className="w-3 h-3 rounded-full border-2 border-white/30" />
                  )}
                  <span className={cn(
                    "font-bold text-sm",
                    isActive ? "text-white" : "text-white/70"
                  )}>
                    {server.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between w-full">
                <span className="text-white/50 text-xs">
                  {server.label || `Backup ${server.id}`}
                </span>
                <div className="flex items-center gap-1 text-xs">
                  {getStatusIcon(server.status)}
                  <span className={cn(
                    server.status === "online" && "text-green-400",
                    server.status === "offline" && "text-red-400",
                    server.status === "slow" && "text-yellow-400",
                    !server.status && "text-green-400"
                  )}>
                    {getStatusText(server.status)}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
