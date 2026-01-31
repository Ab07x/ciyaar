"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GoalEvent {
    id: string;
    matchId: string;
    team: string;
    teamLogo?: string;
    scorer: string;
    minute: number;
    homeScore: number;
    awayScore: number;
    homeTeam: string;
    awayTeam: string;
    assistedBy?: string;
    goalType?: "goal" | "penalty" | "own_goal";
}

interface GoalNotificationContextType {
    showGoal: (goal: GoalEvent) => void;
}

const GoalNotificationContext = createContext<GoalNotificationContextType | null>(null);

export function useGoalNotification() {
    const context = useContext(GoalNotificationContext);
    if (!context) {
        throw new Error("useGoalNotification must be used within GoalNotificationProvider");
    }
    return context;
}

export function GoalNotificationProvider({ children }: { children: React.ReactNode }) {
    const [goals, setGoals] = useState<GoalEvent[]>([]);

    const showGoal = useCallback((goal: GoalEvent) => {
        setGoals((prev) => [...prev, goal]);

        // Auto-remove after 6 seconds
        setTimeout(() => {
            setGoals((prev) => prev.filter((g) => g.id !== goal.id));
        }, 6000);
    }, []);

    const dismissGoal = (id: string) => {
        setGoals((prev) => prev.filter((g) => g.id !== id));
    };

    return (
        <GoalNotificationContext.Provider value={{ showGoal }}>
            {children}
            <GoalNotificationContainer goals={goals} onDismiss={dismissGoal} />
        </GoalNotificationContext.Provider>
    );
}

function GoalNotificationContainer({
    goals,
    onDismiss
}: {
    goals: GoalEvent[];
    onDismiss: (id: string) => void;
}) {
    return (
        <div className="fixed top-20 right-4 z-[100] space-y-3 pointer-events-none">
            <AnimatePresence>
                {goals.map((goal) => (
                    <GoalNotificationCard key={goal.id} goal={goal} onDismiss={() => onDismiss(goal.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function GoalNotificationCard({
    goal,
    onDismiss
}: {
    goal: GoalEvent;
    onDismiss: () => void;
}) {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => Math.max(0, prev - 1.67)); // 6 seconds = 100/60fps*6
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const goalTypeLabel = {
        goal: "GOAL!",
        penalty: "PENALTY GOAL!",
        own_goal: "OWN GOAL!"
    }[goal.goalType || "goal"];

    const goalTypeColor = {
        goal: "from-green-600 to-green-500",
        penalty: "from-yellow-600 to-yellow-500",
        own_goal: "from-red-600 to-red-500"
    }[goal.goalType || "goal"];

    return (
        <motion.div
            initial={{ x: 400, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 400, opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
                "pointer-events-auto bg-gradient-to-r text-white rounded-xl shadow-2xl max-w-sm overflow-hidden",
                goalTypeColor
            )}
        >
            {/* Progress bar */}
            <div className="h-1 bg-black/20">
                <div
                    className="h-full bg-white/50 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Goal Icon */}
                    <div className="flex-shrink-0">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.3, 1] }}
                            transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                            className="text-4xl"
                        >
                            ⚽
                        </motion.div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <motion.p
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="font-black text-xl tracking-wide"
                        >
                            {goalTypeLabel}
                        </motion.p>
                        <motion.p
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-white/90 font-medium"
                        >
                            {goal.team}
                        </motion.p>
                        <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-1"
                        >
                            <span className="font-bold">{goal.scorer}</span>
                            <span className="text-white/70 ml-2">{goal.minute}'</span>
                            {goal.assistedBy && (
                                <span className="text-white/60 text-sm block">
                                    Assist: {goal.assistedBy}
                                </span>
                            )}
                        </motion.div>
                    </div>

                    {/* Score */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4, type: "spring" }}
                        className="flex-shrink-0 bg-black/20 rounded-lg px-3 py-2 text-center"
                    >
                        <div className="text-2xl font-black">
                            {goal.homeScore} - {goal.awayScore}
                        </div>
                        <div className="text-[10px] text-white/70 uppercase tracking-wider mt-1">
                            {goal.homeTeam.substring(0, 3)} vs {goal.awayTeam.substring(0, 3)}
                        </div>
                    </motion.div>
                </div>

                {/* Dismiss button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
                >
                    <span className="text-white/70 text-sm">×</span>
                </button>
            </div>

            {/* Celebration particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            x: "50%",
                            y: "50%",
                            scale: 0,
                            opacity: 1
                        }}
                        animate={{
                            x: `${Math.random() * 100}%`,
                            y: `${Math.random() * 100}%`,
                            scale: [0, 1, 0],
                            opacity: [1, 1, 0]
                        }}
                        transition={{
                            duration: 1,
                            delay: i * 0.1,
                            ease: "easeOut"
                        }}
                        className="absolute w-2 h-2 bg-white/50 rounded-full"
                    />
                ))}
            </div>
        </motion.div>
    );
}

// Demo function to test the notification
export function GoalNotificationDemo() {
    const { showGoal } = useGoalNotification();

    const triggerDemo = () => {
        showGoal({
            id: Date.now().toString(),
            matchId: "demo",
            team: "Manchester United",
            scorer: "Marcus Rashford",
            minute: 34,
            homeScore: 1,
            awayScore: 0,
            homeTeam: "Manchester United",
            awayTeam: "Liverpool",
            assistedBy: "Bruno Fernandes",
            goalType: "goal"
        });
    };

    return (
        <button
            onClick={triggerDemo}
            className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
        >
            Test Goal Notification
        </button>
    );
}
