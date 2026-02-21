// /aflaam — Captures "fanproj aflaam" (2,899 impressions / 1,136 clicks)
// Permanently redirects to /movies so all link equity flows there.
import { permanentRedirect } from "next/navigation";

export default function AflaamPage() {
    permanentRedirect("/movies");
}
