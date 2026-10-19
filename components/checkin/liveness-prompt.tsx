"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import type { LivenessProgress } from "@/lib/checkin/liveness-client"

/**
 * Overlay shown on the camera while a liveness challenge runs.
 * The preview is mirrored, so "turn to your left" points to the left of the screen.
 */
export function LivenessPrompt({ progress, name }: { progress: LivenessProgress; name?: string }) {
  const current = progress.steps[progress.step]
  const Arrow = current === "left" ? ArrowLeft : ArrowRight
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between p-5 text-white pointer-events-none">
      <div className="rounded-full bg-black/60 px-4 py-1.5 text-sm font-medium">
        {name ? `${name}, quick check that it's really you` : "Quick check that it's really you"}
      </div>
      <div className={`flex items-center ${current === "left" ? "self-start" : "self-end"}`}>
        <Arrow className="w-20 h-20 drop-shadow-lg animate-pulse" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="rounded-xl bg-black/70 px-4 py-2 text-lg font-semibold" role="status" aria-live="polite">{progress.hint}</p>
        <div className="flex gap-2" aria-hidden="true">
          {progress.steps.map((step, index) => (
            <span key={index} className={`h-2.5 w-8 rounded-full ${index < progress.step ? "bg-green-400" : index === progress.step ? "bg-white" : "bg-white/35"}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
