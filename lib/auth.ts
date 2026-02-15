import crypto from "crypto";
import { NextResponse } from "next/server";

export const USER_SESSION_COOKIE = "fanbroj_user_session";
export const USER_SESSION_TTL_DAYS = Number(process.env.USER_SESSION_TTL_DAYS || 90);
export const USER_SESSION_TTL_MS = USER_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export function normalizeEmail(input: string): string {
    return input.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
    // Pragmatic validation for quick signup UX.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function createSalt(): string {
    return crypto.randomBytes(16).toString("hex");
}

function scryptAsync(password: string, salt: string): Promise<string> {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(derivedKey.toString("hex"));
        });
    });
}

export async function hashPassword(password: string, salt: string): Promise<string> {
    return scryptAsync(password, salt);
}

export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
    const hash = await scryptAsync(password, salt);
    const hashBuf = Buffer.from(hash, "hex");
    const expectedBuf = Buffer.from(expectedHash, "hex");
    if (hashBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, expectedBuf);
}

export function createSessionToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export function setUserSessionCookie(response: NextResponse, token: string, expiresAt: number) {
    response.cookies.set(USER_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(expiresAt),
    });
}

export function clearUserSessionCookie(response: NextResponse) {
    response.cookies.set(USER_SESSION_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(0),
    });
}

export function createDefaultDisplayName(email: string): string {
    const local = email.split("@")[0] || "Fanbroj";
    const cleaned = local.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
    return cleaned || "Fanbroj";
}
