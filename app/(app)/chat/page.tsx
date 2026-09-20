'use client'

import * as React from 'react'
import { Mic, MicOff, X } from 'lucide-react'
import Image from 'next/image'

const BLUE = '#1300BA'

export default function ChatPage() {
  const [voiceOpen, setVoiceOpen] = React.useState(false)
  const [listening, setListening] = React.useState(false)

  return (
    <main className="relative flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden">
      <div className="flex flex-1 items-center justify-center px-4 py-10 md:px-8">
        <div className="w-full max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Arbyter
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            What do you want Arbyter to do?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Talk to your AI workforce through one interface.
          </p>

          <div className="mx-auto mt-10 flex max-w-2xl items-center gap-3 rounded-[1.5rem] border border-white/80 bg-white/72 p-2 shadow-[0_18px_55px_rgba(32,38,75,.10)] backdrop-blur-2xl">
            <div className="flex h-12 flex-1 items-center px-4 text-left text-sm text-muted-foreground">
              Ask Arbyter anything…
            </div>
            <button
              type="button"
              onClick={() => {
                setVoiceOpen(true)
                setListening(true)
              }}
              aria-label="Speak to Arbyter"
              className="liquid-glass-press flex size-12 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/75 text-foreground shadow-sm transition hover:text-primary"
            >
              <Mic className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {voiceOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/20 p-4 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setVoiceOpen(false)} aria-hidden="true" />

          <section className="relative flex min-h-[min(720px,88vh)] w-full max-w-3xl flex-col items-center justify-between overflow-hidden rounded-[2rem] border border-white/85 bg-white/[.78] p-6 shadow-[0_30px_100px_rgba(20,25,55,.22)] backdrop-blur-3xl md:p-10">
            <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_50%_42%,rgba(19,0,186,.12),transparent_30%),radial-gradient(circle_at_15%_90%,rgba(90,150,255,.10),transparent_30%)]" />

            <div className="relative z-10 flex w-full items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.24em] text-primary">
                  Arbyter
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Voice mode
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVoiceOpen(false)}
                aria-label="Close voice mode"
                className="flex size-11 items-center justify-center rounded-full border border-white/80 bg-white/65 text-muted-foreground shadow-sm backdrop-blur-xl transition hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="relative z-10 flex flex-1 items-center justify-center">
              <div className={listening ? 'relative flex size-64 items-center justify-center md:size-80' : 'relative flex size-64 items-center justify-center md:size-80'}>
                <span className={listening ? 'absolute size-64 animate-ping rounded-full border border-primary/20 md:size-80' : 'absolute size-64 rounded-full border border-primary/10 md:size-80'} />
                <span className={listening ? 'absolute size-48 animate-[pulse_2s_ease-in-out_infinite] rounded-full bg-primary/[.06] blur-xl md:size-60' : 'absolute size-48 rounded-full bg-primary/[.04] blur-xl md:size-60'} />
                <span className="absolute size-40 rounded-full border border-white/90 bg-white/[.62] shadow-[0_25px_70px_rgba(19,0,186,.12)] backdrop-blur-2xl md:size-52" />

                <div className={listening ? 'relative z-10 h-28 w-32 animate-[pulse_1.8s_ease-in-out_infinite] md:h-36 md:w-40' : 'relative z-10 h-28 w-32 md:h-36 md:w-40'}>
                  <Image
                    src="/arbyter-logo.svg"
                    alt="Arbyter"
                    fill
                    sizes="160px"
                    className="object-contain drop-shadow-[0_14px_30px_rgba(19,0,186,.14)]"
                    priority
                  />
                </div>

                <div className="absolute bottom-7 z-20 flex items-end gap-1.5 md:bottom-9">
                  {[18, 30, 44, 24, 38, 52, 26, 40, 20].map((height, index) => (
                    <span
                      key={index}
                      className={listening ? 'w-1 rounded-full bg-primary/65 animate-[voicebar_900ms_ease-in-out_infinite]' : 'w-1 rounded-full bg-primary/30'}
                      style={{ height, animationDelay: `${index * 80}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-5">
              <div className="text-center">
                <p className="text-lg font-medium tracking-tight text-foreground">
                  {listening ? 'Listening…' : 'Ready'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Demo only · voice connection is not wired yet
                </p>
              </div>

              <button
                type="button"
                onClick={() => setListening((value) => !value)}
                className="liquid-glass-press flex size-16 items-center justify-center rounded-full border border-white/90 bg-white/[.82] text-foreground shadow-[0_18px_45px_rgba(32,38,75,.14)] backdrop-blur-2xl transition hover:text-primary"
                aria-label={listening ? 'Stop listening' : 'Start listening'}
              >
                {listening ? <MicOff className="size-6" /> : <Mic className="size-6" />}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <style jsx global>{`
        @keyframes voicebar {
          0%, 100% { transform: scaleY(.45); opacity: .45; }
          50% { transform: scaleY(1.25); opacity: 1; }
        }
      `}</style>
    </main>
  )
}