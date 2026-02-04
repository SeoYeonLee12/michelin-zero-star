"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface StarRewardBadgeProps {
    amount: number
    label?: string
    customText?: string
    className?: string
    layout?: "vertical" | "horizontal"
    starSize?: "sm" | "md" | "lg"
    textSize?: "sm" | "md" | "lg"
    onAnimationComplete?: () => void
}

export function StarRewardBadge({
    amount,
    label,
    customText,
    className,
    layout = "vertical",
    starSize = "md",
    textSize = "md",
    onAnimationComplete,
}: StarRewardBadgeProps) {
    const isHorizontal = layout === "horizontal"

    const starSizes = {
        sm: "h-8 w-8",
        md: "h-16 w-16",
        lg: "h-24 w-24",
    }

    const textSizes = {
        sm: "text-lg",
        md: "text-4xl",
        lg: "text-6xl",
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onAnimationComplete={onAnimationComplete}
            className={cn("flex items-center justify-center", isHorizontal ? "flex-row gap-3" : "flex-col", className)}
        >
            <div className={cn("relative", !isHorizontal && "mb-3")}>
                <motion.div
                    animate={{
                        rotate: [0, 8, -8, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 4,
                        ease: "easeInOut",
                    }}
                >
                    <img
                        src="/michelin-star.png"
                        alt="Michelin Star"
                        className={cn(starSizes[starSize], "drop-shadow-md")}
                    />
                </motion.div>
                <div className="absolute inset-0 bg-[#800020]/5 blur-2xl rounded-full -z-10" />
            </div>

            <div className={isHorizontal ? "text-left" : "text-center"}>
                <p className={cn("text-[#800020] font-bold tracking-tighter leading-none whitespace-nowrap", textSizes[textSize])}>
                    {customText || `+${amount.toFixed(1)}`}
                </p>
                {label && (
                    <p className="text-[10px] font-black text-[#800020]/40 uppercase tracking-[0.2em] mt-1">
                        {label}
                    </p>
                )}
            </div>
        </motion.div>
    )
}
