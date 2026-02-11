
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeriesClientPage from "./SeriesClientPage";
import connectDB from "@/lib/mongodb";
import { Series } from "@/lib/models";

// Force dynamic rendering as we rely on slug param
export const dynamic = "force-dynamic";

async function getSeries(slug: string) {
    try {
        await connectDB();
        const series = await Series.findOne({ slug }).lean();
        if (!series) return null;
        return JSON.parse(JSON.stringify(series));
    } catch (e) {
        console.error("Error fetching series for metadata:", e);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const series = await getSeries(slug);

    if (!series) {
        return {
            title: "Series Not Found | Fanbroj",
            description: "The series you are looking for does not exist."
        };
    }

    const title = `Daawo ${series.titleSomali || series.title} ${series.isDubbed ? "Af-Somali" : ""} | Fanbroj`;
    const description = series.overviewSomali || series.overview || `Watch ${series.title} online in HD on Fanbroj.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [series.backdropUrl || series.posterUrl || "/placeholder.jpg"],
            type: "video.tv_show",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [series.backdropUrl || series.posterUrl || "/placeholder.jpg"],
        }
    };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const series = await getSeries(slug);

    if (!series) return notFound();

    return <SeriesClientPage initialSeries={series} />;
}
