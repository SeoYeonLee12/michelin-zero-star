"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const accessToken = sp.get("accessToken");

    if (!accessToken) {
      router.replace("/login?error=missing_access_token");
      return;
    }

    // 1) 토큰 저장 (너희 구조에 맞게 나중에 auth-context로 옮겨도 됨)
    localStorage.setItem("accessToken", accessToken);

    // 2) URL에서 토큰 제거 (히스토리/노출 최소화)
    // replace로 같은 페이지를 토큰 없이 다시 렌더링시키지 말고 그냥 홈으로 보내는 게 깔끔
    router.replace("/");
  }, [router, sp]);

  return null;
}