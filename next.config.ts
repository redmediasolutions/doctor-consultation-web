import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Database drivers run only on the server and must not be bundled.
  serverExternalPackages: ["pg", "@electric-sql/pglite"],

  // `npm run dev` serves its scripts only to localhost by default. These let you open the
  // dev server from a phone/tablet on the same Wi-Fi (http://192.168.x.x:3000).
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],

  // The Flutter app (and Flutter web, if used) calls these APIs from another origin.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, x-auth" },
        ],
      },
    ];
  },

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
