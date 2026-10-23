import type { NextConfig } from "next";

/**
 * Frontend only. All data comes from the Gladskin Node.js API (/api/tele/*),
 * see NEXT_PUBLIC_API_BASE_URL in .env.local.
 */
const nextConfig: NextConfig = {
  // `npm run dev` serves its scripts only to localhost by default. These let you open the
  // dev server from a phone/tablet on the same Wi-Fi (http://192.168.x.x:3000).
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
