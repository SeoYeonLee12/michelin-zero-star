// frontend/app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setGlobalAccessToken } from "@/lib/api/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const accessToken = sp.get("accessToken");

    if (accessToken) {
      // 1) 메모리 토큰 설정 (Global Variable)
      setGlobalAccessToken(accessToken);
    }

    // 2) 홈으로 이동 (AuthContext가 마운트되면서 fetchUser/SilentRefresh 등을 진행함)
    router.replace("/");
  }, [router, sp]);

  return null;
}