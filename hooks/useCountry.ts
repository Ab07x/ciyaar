"use client";

import { useState, useEffect } from "react";

interface CountryData {
    country: string;
    countryCode: string;
    loading: boolean;
}

export function useCountry(): CountryData {
    const [data, setData] = useState<CountryData>({
        country: "Somalia", // Default fallback
        countryCode: "SO",
        loading: true,
    });

    useEffect(() => {
        // Check localStorage first for cached country
        const cached = localStorage.getItem("userCountry");
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                // Cache valid for 24 hours
                if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                    setData({
                        country: parsed.country,
                        countryCode: parsed.countryCode,
                        loading: false,
                    });
                    return;
                }
            } catch (e) {
                // Invalid cache, continue to fetch
            }
        }

        // Fetch country from IP geolocation API
        const fetchCountry = async () => {
            try {
                // Using ip-api.com (free, no API key required)
                const response = await fetch("http://ip-api.com/json/?fields=country,countryCode");
                if (response.ok) {
                    const result = await response.json();
                    if (result.country) {
                        const countryData = {
                            country: result.country,
                            countryCode: result.countryCode,
                            timestamp: Date.now(),
                        };
                        localStorage.setItem("userCountry", JSON.stringify(countryData));
                        setData({
                            country: result.country,
                            countryCode: result.countryCode,
                            loading: false,
                        });
                        return;
                    }
                }
            } catch (error) {
                // Try fallback API
                try {
                    const fallbackResponse = await fetch("https://ipapi.co/json/");
                    if (fallbackResponse.ok) {
                        const result = await fallbackResponse.json();
                        if (result.country_name) {
                            const countryData = {
                                country: result.country_name,
                                countryCode: result.country_code,
                                timestamp: Date.now(),
                            };
                            localStorage.setItem("userCountry", JSON.stringify(countryData));
                            setData({
                                country: result.country_name,
                                countryCode: result.country_code,
                                loading: false,
                            });
                            return;
                        }
                    }
                } catch {
                    // All APIs failed, use default
                }
            }

            // Fallback to default
            setData({
                country: "Somalia",
                countryCode: "SO",
                loading: false,
            });
        };

        fetchCountry();
    }, []);

    return data;
}
