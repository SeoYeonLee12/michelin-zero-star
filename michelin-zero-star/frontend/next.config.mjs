/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },

  // Docker/Windows 환경에서 파일 변경 감지 및 성능 최적화를 위한 Polling 설정
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,   // 1초마다 변경 확인 (CPU 부하 감소)
        aggregateTimeout: 300, // 변경 후 0.3초 대기
      }
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