/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },

  // ✅ Docker 환경에서 파일 변경 감지를 위한 Webpack Polling 설정
  // (Turbopack 대신 Webpack을 사용하도록 유도하며, 메모리 사용량을 조절)
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000, // 1초마다 폴링 (CPU/메모리 절약)
      aggregateTimeout: 300, // 변경 감지 후 300ms 대기 후 빌드
    }
    return config
  },

  async rewrites() {
    return [
      // ✅ 레시피 API → 백엔드
      // ✅ 이미지 정적 파일 → 백엔드
      {
        source: "/images/:path*",
        destination: "http://backend:8080/images/:path*",
      },
      // ✅ 요리 완료 API → 백엔드
      {
        source: "/api/cooking/:path*",
        destination: "http://backend:8080/api/cooking/:path*",
      },
      // ✅ 모든 /api 요청 → 백엔드
      {
        source: "/api/:path*",
        destination: "http://backend:8080/api/:path*",
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