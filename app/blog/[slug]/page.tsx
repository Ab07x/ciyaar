import type { Metadata } from "next";
import BlogClientPage from "./BlogClientPage";

interface BlogPostPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://fanbroj.net'}/api/posts/${slug}`, { cache: 'no-store' });
    const post = res.ok ? await res.json() : null;

    if (!post) return { title: "Post Not Found - Fanbroj" };

    const title = post.title;
    const description = post.excerpt;
    const imageUrl = post.featuredImageUrl || "https://fanbroj.net/og-image-blog.jpg";

    return {
        title: `${title} – Wararka Kubadda Cagta | Fanbroj`,
        description,
        alternates: {
            canonical: `https://fanbroj.net/blog/${slug}`,
        },
        openGraph: {
            title: `${title} – Wararka Kubadda Cagta | Fanbroj`,
            description,
            type: "article",
            url: `https://fanbroj.net/blog/${slug}`,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${title} – Wararka Kubadda Cagta | Fanbroj`,
            description,
            images: [imageUrl],
        },
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://fanbroj.net'}/api/posts/${slug}`, { cache: 'no-store' });
    const post = res.ok ? await res.json() : null;

    const jsonLd = post ? {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": post.title,
        "image": post.featuredImageUrl ? [post.featuredImageUrl] : ["https://fanbroj.net/og-image-blog.jpg"],
        "datePublished": new Date(post.publishedAt || Date.now()).toISOString(),
        "dateModified": new Date(post.updatedAt || post._creationTime).toISOString(),
        "author": [{
            "@type": "Organization",
            "name": "Fanbroj News",
            "url": "https://fanbroj.net"
        }]
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <BlogClientPage slug={slug} />
        </>
    );
}
