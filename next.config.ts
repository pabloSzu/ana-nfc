import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    // Las mascotas tienen una URL pública clara, pero se renderizan con la misma página y caché
    // que las demás landings. El enlace viejo /slug sigue funcionando como respaldo.
    return [{ source: "/mascota/:slug", destination: "/:slug" }];
  },
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 2_678_400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
