'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export function Intro() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const seen = localStorage.getItem('arbyter-intro-seen')

    if (seen) {
      setVisible(false)
      return
    }

    const timer = setTimeout(() => {
      localStorage.setItem('arbyter-intro-seen', 'true')
      setVisible(false)
    }, 2800)

    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center text-center">
        <div className="animate-[introLogo_0.8s_ease-out_forwards] opacity-0">
          <Image
            src="/arbyter-logo.svg"
            alt="Arbyter OS"
            width={72}
            height={72}
            priority
            className="h-[72px] w-[72px] object-contain"
          />
        </div>

        <div className="mt-6 overflow-hidden">
          <div className="animate-[introText_0.7s_0.5s_ease-out_forwards] translate-y-full opacity-0 text-2xl font-semibold tracking-[-0.04em]">
            ARBYTER OS
          </div>
        </div>

        <div className="mt-2 overflow-hidden">
          <div className="animate-[introTagline_0.7s_1s_ease-out_forwards] translate-y-full opacity-0 text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400">
            Orchestrate · Govern · Secure
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes introLogo {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes introText {
          0% {
            opacity: 0;
            transform: translateY(100%);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes introTagline {
          0% {
            opacity: 0;
            transform: translateY(100%);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}