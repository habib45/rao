const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      { protocol: "https", hostname: "encrypted-tbn1.gstatic.com" },
      { protocol: "https", hostname: "encrypted-tbn2.gstatic.com" },
      { protocol: "https", hostname: "encrypted-tbn3.gstatic.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "outdoorgearlab.b-cdn.net" },
      // Bunny CDN serves uploaded blog assets.
      { protocol: "https", hostname: "*.b-cdn.net" },
      // Optional allowlist for additional CDN hosts. Add one entry per host.
      // Using port-based restrictions keeps the image proxy attack surface small.
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Blog post cover images sourced from external review sites.
      { protocol: "https", hostname: "amindfullmom.com" },
      // Legacy Supabase Storage bucket — comparison blocks and media-library
      // entries authored before the Supabase→MySQL migration still reference
      // these URLs. The deployment plan says to retire this host once all
      // content has been re-uploaded to /public/uploads; for now the
      // hostname is left in the allowlist so existing pages keep rendering.
      { protocol: "https", hostname: "cjyjsagxcabwzvrlfizs.supabase.co" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === "true",
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ckeditor5: "ckeditor5/ckeditor5.js",
    };

    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization?.splitChunks,
        cacheGroups: {
          ...config.optimization?.splitChunks?.cacheGroups,
          ckeditor: {
            test: /[\\/]node_modules[\\/](ckeditor5|@ckeditor)[\\/]/,
            name: "ckeditor",
            chunks: "all",
          },
        },
      },
    };

    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Enable Brotli compression for better performance
          { key: "Accept-Encoding", value: "br, gzip" },
        ],
      },
      {
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/(.*)\\.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  compress: true,
};

module.exports = withNextIntl(nextConfig);
