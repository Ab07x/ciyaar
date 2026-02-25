import { redirect } from "next/navigation";

export default function PremiumPage() {
    redirect("/pay?auth=signup");
}
