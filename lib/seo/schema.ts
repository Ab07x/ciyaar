export function generateMovieSchema(movie: any) {
    const schema: any = {
        "@context": "https://schema.org",
        "@type": "Movie",
        "name": movie.title,
        "alternateName": movie.titleSomali || undefined,
        "image": movie.posterUrl,
        "description": movie.overview || movie.overviewSomali,
        "datePublished": movie.releaseDate,
        "duration": movie.runtime ? `PT${movie.runtime}M` : undefined,
        "genre": movie.genres || [],
        "inLanguage": movie.isDubbed ? "so" : "en",
        "contentRating": movie.ratingMpaa || undefined,
    };

    // Director with proper Person schema
    if (movie.director) {
        schema.director = {
            "@type": "Person",
            "name": movie.director
        };
    }

    // Cast with proper Person schema (handles both string array and object array)
    if (movie.cast && movie.cast.length > 0) {
        schema.actor = movie.cast.map((actor: any) => ({
            "@type": "Person",
            "name": typeof actor === "string" ? actor : actor.name,
            "characterName": typeof actor === "object" ? actor.character : undefined
        }));
    }

    // Aggregate Rating for rich snippets
    if (movie.rating) {
        schema.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": movie.rating,
            "bestRating": "10",
            "worstRating": "1",
            "ratingCount": movie.voteCount || movie.views || 100
        };
    }

    // Trailer VideoObject
    if (movie.trailerUrl) {
        schema.trailer = {
            "@type": "VideoObject",
            "name": `${movie.title} - Official Trailer`,
            "embedUrl": movie.trailerUrl,
            "thumbnailUrl": movie.backdropUrl || movie.posterUrl
        };
    }

    // Clean undefined values
    return JSON.parse(JSON.stringify(schema));
}

export function generateTVSchema(show: any) {
    const schema: any = {
        "@context": "https://schema.org",
        "@type": "TVSeries",
        "name": show.title,
        "alternateName": show.titleSomali || undefined,
        "image": show.posterUrl,
        "description": show.overview || show.overviewSomali,
        "startDate": show.firstAirDate,
        "endDate": show.lastAirDate || undefined,
        "numberOfSeasons": show.numberOfSeasons || undefined,
        "numberOfEpisodes": show.numberOfEpisodes || undefined,
        "genre": show.genres || [],
        "inLanguage": show.isDubbed ? "so" : "en",
    };

    // Cast with proper Person schema
    if (show.cast && show.cast.length > 0) {
        schema.actor = show.cast.map((actor: any) => ({
            "@type": "Person",
            "name": typeof actor === "string" ? actor : actor.name,
            "characterName": typeof actor === "object" ? actor.character : undefined
        }));
    }

    // Aggregate Rating
    if (show.rating) {
        schema.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": show.rating,
            "bestRating": "10",
            "worstRating": "1",
            "ratingCount": show.voteCount || show.views || 100
        };
    }

    // Clean undefined values
    return JSON.parse(JSON.stringify(schema));
}

// Generate BreadcrumbList schema for navigation
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
        }))
    };
}

// Generate VideoObject schema for watch pages
export function generateVideoSchema(content: any, type: "movie" | "episode") {
    return {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": content.title || content.titleSomali,
        "description": content.overview || content.overviewSomali,
        "thumbnailUrl": content.posterUrl || content.stillUrl,
        "uploadDate": content.releaseDate || content.airDate,
        "duration": content.runtime ? `PT${content.runtime}M` : undefined,
        "contentRating": content.ratingMpaa || undefined,
        "inLanguage": content.isDubbed ? "so" : "en"
    };
}
