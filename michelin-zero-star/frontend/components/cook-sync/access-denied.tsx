"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogIn, MapPin, Home, ChevronRight, UserCog } from "lucide-react"
import { motion } from "framer-motion"

interface AccessDeniedProps {
  type: "login" | "location"
}
// 커밋을 위한 
export function AccessDenied({ type }: AccessDeniedProps) {
  const router = useRouter()

  const config = {
    login: {
      icon: LogIn,
      title: "로그인이 필요해요",
      description: "서비스를 이용하려면 로그인해주세요",
      primaryButton: { label: "로그인", onClick: () => router.push("/login") },
      secondaryButton: null,
    },
    location: {
      icon: MapPin,
      title: "동네 인증이 필요해요",
      description: "내 동네를 설정하고 이웃들과 나눔을 시작하세요",
      primaryButton: { label: "프로필에서 인증하기", onClick: () => router.push("/profile"), icon: UserCog },
      secondaryButton: { label: "홈으로", onClick: () => router.push("/"), icon: Home },
    },
  }

  const { icon: Icon, title, description, primaryButton, secondaryButton } = config[type]

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col items-center text-center max-w-xs"
      >
        {/* Minimal icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="w-14 h-14 rounded-full bg-[#800020]/10 flex items-center justify-center mb-5"
        >
          <Icon className="w-6 h-6 text-[#800020]" strokeWidth={1.5} />
        </motion.div>

        {/* Text */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-lg font-semibold text-stone-900 mb-2"
        >
          {title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-stone-500 mb-8 leading-relaxed"
        >
          {description}
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col gap-2 w-full"
        >
          <Button
            onClick={primaryButton.onClick}
            className="h-11 px-6 bg-[#800020] hover:bg-[#800020]/90 text-white text-sm font-medium rounded-full transition-colors group"
          >
            {"icon" in primaryButton && primaryButton.icon && <primaryButton.icon className="w-4 h-4 mr-1.5" />}
            {primaryButton.label}
            <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>

          {secondaryButton && (
            <Button
              variant="ghost"
              onClick={secondaryButton.onClick}
              className="h-10 text-sm text-stone-500 hover:text-stone-700 hover:bg-transparent"
            >
              {secondaryButton.icon && <secondaryButton.icon className="w-4 h-4 mr-1.5" />}
              {secondaryButton.label}
            </Button>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
