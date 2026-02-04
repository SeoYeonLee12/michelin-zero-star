"use client"
import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function ChatRedirectPage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    if (params.userId) {
      router.replace(`/messages?roomId=${params.userId}`)
    } else {
      router.replace("/messages")
    }
  }, [params, router])

  return null
}