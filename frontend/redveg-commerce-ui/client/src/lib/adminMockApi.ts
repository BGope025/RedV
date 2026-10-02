import { orders, products, stats } from "@/data/mock";

const now = new Date();
const campaigns = [
  {
    id: "CMP-DEMO-001",
    name: "Sunday Family Combo",
    slug: "sunday-family-combo",
    occasion: "weekend",
    placement: "home",
    label: "Save ₹220",
    message: "A complete family spread for Sunday lunch.",
    ctaLabel: "Shop combo",
    startsAt: new Date(now.getTime() - 86400000).toISOString(),
    endsAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
    status: "published",
    priority: 10,
    createdAt: new Date(now.getTime() - 86400000).toISOString(),
    updatedAt: now.toISOString(),
  },
];

const deliveryLocations = [
  { pincode: "700029", area: "Kalighat", city: "Kolkata", state: "West Bengal", isServiceable: true, updatedAt: now.toISOString() },
  { pincode: "700019", area: "Ballygunge", city: "Kolkata", state: "West Bengal", isServiceable: true, updatedAt: now.toISOString() },
  { pincode: "700064", area: "Salt Lake", city: "Kolkata", state: "West Bengal", isServiceable: false, updatedAt: now.toISOString() },
];

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", "X-RedVeg-Data-Mode": "mock" },
  });
}

function backendProducts() {
  return products.map((product) => ({
    ...product,
    image_url: product.image,
    is_active: product.variants.some((variant) => variant.stock > 0) ? 1 : 0,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.id,
      label: variant.label,
      size: null,
      weight: variant.label,
      price: variant.price,
      stock: variant.stock,
      stockCount: variant.stock,
      stock_count: variant.stock,
      available: variant.available,
    })),
  }));
}

function backendOrders() {
  return orders.map((order) => ({
    ...order,
    customer_name: order.customer,
    total_amount: order.total,
    created_at: new Date().toISOString(),
    cart_snapshot: order.items,
  }));
}

function backendVariants() {
  return products.flatMap((product) => product.variants.map((variant) => ({
    id: variant.id,
    product_id: product.id,
    sku: variant.id,
    size: variant.label,
    weight: variant.label,
    price: variant.price,
    stock_count: variant.stock,
  })));
}

export function mockApiFetch(path: string, method = "GET") {
  if (method !== "GET") return jsonResponse({ success: true, message: "Preview mode: change simulated" });
  const normalized = path.replace(/^\/+/, "").split("?")[0];
  if (normalized === "products" || normalized === "admin/products") return jsonResponse({ success: true, data: backendProducts() });
  if (normalized === "admin/variants") return jsonResponse({ success: true, data: backendVariants() });
  if (normalized.startsWith("variants/products/") && normalized.endsWith("/variants")) {
    const productId = normalized.split("/")[2];
    return jsonResponse({ success: true, data: backendVariants().filter((variant) => variant.product_id === productId) });
  }
  if (normalized === "orders") return jsonResponse({ success: true, data: backendOrders() });
  if (normalized === "stats") return jsonResponse(stats);
  if (normalized.startsWith("stats/revenue")) {
    return jsonResponse({ success: true, data: { currency: "INR", timezone: "Asia/Kolkata", range: "lifetime", bucket: "month", summary: { lifetimeRevenue: 24680, periodRevenue: 24680, orderCount: 18, averageOrderValue: 1371 }, series: [{ period: "2026-10", label: "October 2026", revenue: 24680, orders: 18 }] } });
  }
  if (normalized === "campaigns" || normalized === "campaigns/active") return jsonResponse({ success: true, data: campaigns });
  if (normalized === "admin/delivery-locations") return jsonResponse({ success: true, data: deliveryLocations, count: deliveryLocations.length, total: deliveryLocations.length, serviceableCount: 2 });
  if (normalized === "customers") return jsonResponse({ success: true, data: [{ customer_id: "cust-demo", name: "Demo Customer", phone_no: "+919876543210", address: "Kolkata" }] });
  if (normalized === "settings/store-status") return jsonResponse({ success: true, data: { isOpen: true, message: "Preview store is open" } });
  return jsonResponse({ success: true, data: [] });
}

export function isAdminMockMode() {
  return import.meta.env.VITE_ADMIN_DATA_MODE === "mock";
}

export function isAdminCacheFallbackEnabled() {
  return import.meta.env.VITE_ADMIN_CACHE_FALLBACK === "true";
}
