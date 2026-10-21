import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Solo en desarrollo: deja probar DEV desde otro celular o compu, por la red WiFi
  // (http://192.168.x.x:3000) o por el link de PORTS de VS Code (*.devtunnels.ms). Sin esto Next
  // bloquea sus archivos y la página no responde.
  allowedDevOrigins: ["192.168.*.*", "*.devtunnels.ms", "*.*.devtunnels.ms"],
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
      // El link de PORTS de VS Code llega con otro dominio; en producción no se habilita nada.
      ...(isDev ? { allowedOrigins: ["*.devtunnels.ms", "*.*.devtunnels.ms"] } : {}),
    },
  },
};

export default nextConfig;
