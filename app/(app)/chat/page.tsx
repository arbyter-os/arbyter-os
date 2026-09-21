'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  ArrowUp,
  Mic,
  MicOff,
  Plus,
  LayoutDashboard,
  Search,
  MessageSquare,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'

const BLUE = '#1300BA'

export default function ChatPage() {
  const [message, setMessage] = useState('')
  const [listening, setListening] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)

  const sendMessage = () => {
    if (!message.trim()) return
    setMessage('')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f9fc] text-[#111]">

      {/* Ambient background */}
      <div
        className="pointer-events-none absolute left-1/2 top-[18%] h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-[0.055] blur-3xl"
        style={{ background: BLUE }}
      />

      {/* Main chat area */}
      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 pb-40 pt-12 sm:px-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-black/40">AI Workforce</p>
            <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
              Chat with Arbyter
            </h1>
          </div>

          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.07] bg-white/75 shadow-[0_4px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl"
          >
            <Sparkles size={16} style={{ color: BLUE }} />
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-1 flex-col items-center justify-center pb-10">

          <div
            className="mb-7 flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/80 shadow-[0_12px_45px_rgba(0,0,0,0.08)] backdrop-blur-xl"
          >
            <Image
              src="/arbyter-logo.svg"
              alt="Arbyter"
              width={38}
              height={38}
              priority
            />
          </div>

          <h2 className="text-center text-[clamp(30px,5vw,48px)] font-semibold tracking-[-0.055em]">
            What do you want Arbyter to do?
          </h2>

          <p className="mt-3 max-w-md text-center text-sm leading-6 text-black/45">
            Talk to your AI workforce through one interface.
            Ask Arbyter to find agents, perform actions, review risks,
            or change how your workforce operates.
          </p>

          {/* Suggested actions */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              'Find an agent',
              'Review workforce',
              'Check risks',
            ].map((item) => (
              <button
                key={item}
                onClick={() => setMessage(item)}
                className="rounded-full border border-black/[0.07] bg-white/70 px-4 py-2 text-xs font-medium text-black/60 shadow-[0_4px_18px_rgba(0,0,0,0.04)] backdrop-blur-xl transition hover:bg-white"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Composer */}
        <div className="fixed bottom-[92px] left-1/2 z-30 w-[calc(100%-32px)] max-w-3xl -translate-x-1/2">
          <div className="rounded-[25px] border border-white/80 bg-white/[0.78] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.12)] backdrop-blur-2xl">

            <div className="flex items-end gap-2">
              <button
                className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[17px] text-black/45 transition hover:bg-black/[0.04] hover:text-black"
                aria-label="Add"
              >
                <Plus size={20} />
              </button>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                rows={1}
                placeholder="Ask Arbyter anything..."
                className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-1 py-3 text-[15px] outline-none placeholder:text-black/35"
              />

              <button
                onClick={() => {
                  setVoiceOpen(true)
                  setListening(true)
                }}
                className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[17px] text-black/45 transition hover:bg-black/[0.04] hover:text-black"
                aria-label="Voice"
              >
                <Mic size={19} />
              </button>

              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[17px] transition disabled:opacity-25"
                style={{
                  background: message.trim() ? BLUE : 'rgba(0,0,0,0.06)',
                  color: message.trim() ? 'white' : 'rgba(0,0,0,0.4)',
                }}
                aria-label="Send"
              >
                <ArrowUp size={19} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Floating navigation dock */}
        <nav className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-[23px] border border-white/80 bg-white/[0.78] p-1.5 shadow-[0_14px_50px_rgba(0,0,0,0.14)] backdrop-blur-2xl">

            <DockItem
              icon={<LayoutDashboard size={18} />}
              label="Overview"
              href="/overview"
            />

            <DockItem
              icon={<Search size={18} />}
              label="Discovery"
              href="/discovery"
            />

            <DockItem
              icon={<MessageSquare size={18} />}
              label="Chat"
              href="/chat"
              active
            />

            <DockItem
              icon={<Settings size={18} />}
              label="Settings"
              href="/settings"
            />

          </div>
        </nav>
      </section>

      {/* Voice overlay */}
      {voiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 px-5 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-[32px] border border-white/80 bg-white/[0.80] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.18)] backdrop-blur-2xl">

            <button
              onClick={() => {
                setVoiceOpen(false)
                setListening(false)
              }}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] text-black/45 hover:bg-black/[0.07]"
            >
              <X size={17} />
            </button>

            <div className="mb-8 flex justify-center">
              <div className="relative flex h-28 w-28 items-center justify-center">
                {listening && (
                  <>
                    <div
                      className="absolute inset-0 animate-ping rounded-full opacity-10"
                      style={{ background: BLUE }}
                    />
                    <div
                      className="absolute inset-3 rounded-full opacity-10"
                      style={{ background: BLUE }}
                    />
                  </>
                )}

                <div className="relative flex h-20 w-20 items-center justify-center rounded-[27px] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.1)]">
                  <Image
                    src="/arbyter-logo.svg"
                    alt="Arbyter"
                    width={42}
                    height={42}
                  />
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold tracking-[-0.04em]">
              {listening ? 'Listening...' : 'Ready'}
            </h3>

            <p className="mt-2 text-sm text-black/45">
              Tell Arbyter what you want your AI workforce to do.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setListening(!listening)}
                className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
                style={{ background: BLUE }}
              >
                {listening ? <MicOff size={21} /> : <Mic size={21} />}
              </button>
            </div>

            <p className="mt-5 text-[11px] text-black/30">
              Voice interaction
            </p>
          </div>
        </div>
      )}
    </main>
  )
}

function DockItem({
  icon,
  label,
  href,
  active = false,
}: {
  icon: React.ReactNode
  label: string
  href: string
  active?: boolean
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className={`group flex h-11 items-center gap-2 rounded-[17px] px-3 transition-all ${
        active
          ? 'text-white shadow-[0_5px_18px_rgba(19,0,186,0.22)]'
          : 'text-black/45 hover:bg-black/[0.04] hover:text-black/75'
      }`}
      style={active ? { background: BLUE } : undefined}
    >
      {icon}

      <span
        className={`hidden text-xs font-medium sm:block ${
          active ? 'text-white' : ''
        }`}
      >
        {label}
      </span>
    </a>
  )
}