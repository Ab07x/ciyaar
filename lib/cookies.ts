import Cookies from "js-cookie";

const UNLOCK_PREFIX = "fanbroj_unlock_";

export function setPremiumUnlock(matchId: string, days: number = 7) {
    Cookies.set(`${UNLOCK_PREFIX}${matchId}`, "true", { expires: days });
}

export function checkPremiumUnlock(matchId: string): boolean {
    return Cookies.get(`${UNLOCK_PREFIX}${matchId}`) === "true";
}

export function clearPremiumUnlock(matchId: string) {
    Cookies.remove(`${UNLOCK_PREFIX}${matchId}`);
}
