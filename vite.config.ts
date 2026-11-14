import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import preact from "@preact/preset-vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "robots.txt",
        "assets/favicon.ico",
        "assets/favicon.svg",
        "assets/apple-touch-icon.png",
        "assets/ibm-plex-sans-var.woff2",
      ],
      manifest: {
        name: "Warframe Drops PWA",
        short_name: "Warframe Drops PWA",
        description:
          "a warframe app that finds the best place to farm any in-game item by looking through the official drop tables published by Digital Extremes.",
        theme_color: "#1c1917",
        background_color: "#1c1917",
        icons: [
          {
            src: "assets/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "assets/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        // Precache the app shell and the drop data (incl. map.json) for offline use
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,json}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
