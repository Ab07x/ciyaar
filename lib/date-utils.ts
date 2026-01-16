export function formatKickoffTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const matchDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    const time = date.toLocaleTimeString("so-SO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    if (matchDate.getTime() === today.getTime()) {
        return `Maanta ${time}`;
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (matchDate.getTime() === tomorrow.getTime()) {
        return `Berri ${time}`;
    }

    const dayName = date.toLocaleDateString("so-SO", { weekday: "long" });
    return `${dayName} ${time}`;
}

export function getCountdownValues(timestamp: number) {
    const now = Date.now();
    const diff = timestamp - now;

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isStarted: false };
}

export function isMatchLive(kickoffAt: number, status: string): boolean {
    if (status === "live") return true;
    if (status === "finished") return false;

    const now = Date.now();
    const matchTime = kickoffAt;
    const twoHoursAfter = matchTime + 2 * 60 * 60 * 1000;

    return now >= matchTime && now <= twoHoursAfter;
}
