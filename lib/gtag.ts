/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

function gtagEvent(name: string, params?: Record<string, unknown>) {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", name, params);
    }
}

export function trackPageView(url: string) {
    gtagEvent("page_view", { page_path: url });
}

export function trackSelectPlan(plan: string, price: number) {
    gtagEvent("select_item", {
        items: [{ item_id: plan, item_name: `${plan} Plan`, price, currency: "USD" }],
    });
}

export function trackBeginCheckout(plan: string, price: number, paymentMethod: string) {
    gtagEvent("begin_checkout", {
        currency: "USD",
        value: price,
        payment_type: paymentMethod,
        items: [{ item_id: plan, item_name: `${plan} Plan`, price }],
    });
}

export function trackPurchase(orderId: string, plan: string, price: number) {
    gtagEvent("purchase", {
        transaction_id: orderId,
        currency: "USD",
        value: price,
        items: [{ item_id: plan, item_name: `${plan} Plan`, price }],
    });
}

export function trackSignUp() {
    gtagEvent("sign_up", { method: "email" });
}

export function trackCheckoutAbandoned(plan: string, price: number) {
    gtagEvent("checkout_abandoned", { plan, price, currency: "USD" });
}
