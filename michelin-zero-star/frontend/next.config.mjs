/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },

  async rewrites() {
    return [
      // ✅ 일반 API → 백엔드
      {
        source: "/api/v1/:path*",
        destination: "http://backend:8080/api/v1/:path*",
      },

      // ✅ OAuth2 소셜 로그인 시작/콜백 → 백엔드
      {
        source: "/oauth2/:path*",
        destination: "http://backend:8080/oauth2/:path*",
      },
      {
        source: "/login/oauth2/:path*",
        destination: "http://backend:8080/login/oauth2/:path*",
      },
    ]
  },
}

export default nextConfig