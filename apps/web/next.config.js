/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pixelcanvas/shared', '@pixelcanvas/ui', '@pixelcanvas/canvas-engine'],
  experimental: {
    optimizePackageImports: ['@pixelcanvas/ui'],
  },
};

export default nextConfig;