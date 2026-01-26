/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // ⭐️ Docker 환경에서 backend:8080으로 프록시
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://backend:8080/api/:path*",
      },
    ]
  },
}

export default nextConfig