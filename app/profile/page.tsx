import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
    title: "My Account – Fanbroj",
    description: "Manage your Fanbroj Premium account, view subscription status, favourites, and watch later lists.",
    alternates: { canonical: "https://fanbroj.net/profile" },
};

export default function ProfilePage() {
    return <ProfileClient />;
}
