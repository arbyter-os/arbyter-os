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
    <main className="relative min-h-screen overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
      <style jsx global>{`
        @keyframes voiceRing {
          0% { transform: scale(.72); opacity: .62; }
          70% { transform: scale(1.22); opacity: 0; }
          100% { transform: scale(1.22); opacity: 0; }
        }
        @keyframes voiceCore {
          0%, 100% { transform: scale(.96); }
          50% { transform: scale(1.04); }
        }
        @keyframes voiceGlow {
          0%, 100% { transform: scale(.82); opacity: .10; }
          50% { transform: scale(1.15); opacity: .24; }
        }
      `}</style>

      {/* Main chat area */}
      <section className="relative mx-auto flex min-h-screen w-full max-w-[980px] flex-col px-5 pb-40 pt-8 sm:px-8">

        {/* Header */}
        <div className="flex h-11 items-center justify-between border-b border-black/[0.06] pb-3">
          <div>
            <p className="text-xs font-normal tracking-[-0.01em] text-black/48">AI Workforce</p>
            <h1 className="mt-1 text-[21px] font-semibold leading-[1.19] tracking-[0.006em]">
              Chat with Arbyter
            </h1>
          </div>

          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d2d2d7]/[0.64] backdrop-blur-md"
          >
            <Sparkles size={16} style={{ color: BLUE }} />
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-1 flex-col items-center justify-center pb-10">

          <div
            className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-white"
          >
            <Image
              src="/arbyter-logo.svg"
              alt="Arbyter"
              width={38}
              height={38}
              priority
            />
          </div>

          <h2 className="text-center text-[clamp(34px,5vw,56px)] font-semibold leading-[1.07] tracking-[-0.01em]">
            What do you want Arbyter to do?
          </h2>

          <p className="mt-4 max-w-lg text-center text-[17px] font-normal leading-[1.47] tracking-[-0.022em] text-black/60">
            Talk to your AI workforce through one interface.
            Ask Arbyter to find agents, perform actions, review risks,
            or change how your workforce operates.
          </p>

          {/* Suggested actions */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              'Find an agent',
              'Review workforce',
              'Check risks',
            ].map((item) => (
              <button
                key={item}
                onClick={() => setMessage(item)}
                className="rounded-full bg-white px-4 py-2.5 text-sm font-normal text-[#333] ring-1 ring-black/[0.05] transition hover:ring-black/[0.1]"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Composer */}
        <div className="fixed bottom-[88px] left-1/2 z-30 w-[calc(100%-32px)] max-w-3xl -translate-x-1/2">
          <div className="rounded-full border border-black/[0.08] bg-[#f5f5f7]/[0.80] p-1.5 backdrop-blur-2xl">

            <div className="flex items-end gap-2">
              <button
                className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-black/48 transition hover:bg-black/[0.05] hover:text-black"
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
                className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-[17px] leading-[1.47] tracking-[-0.022em] outline-none placeholder:text-black/45"
              />

              <button
                onClick={() => {
                  setVoiceOpen(true)
                  setListening(true)
                }}
                className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-black/48 transition hover:bg-black/[0.05] hover:text-black"
                aria-label="Voice"
              >
                <Mic size={19} />
              </button>

              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition disabled:opacity-25"
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
        <nav className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-0.5 rounded-full border border-black/[0.08] bg-[#f5f5f7]/[0.82] p-1.5 backdrop-blur-2xl">

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
          <div className="relative w-full max-w-md rounded-[18px] border border-black/[0.08] bg-[#f5f5f7]/[0.88] p-8 text-center backdrop-blur-2xl">

            <button
              onClick={() => {
                setVoiceOpen(false)
                setListening(false)
              }}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#d2d2d7]/[0.64] text-black/48 hover:bg-[#d2d2d7]/[0.8]"
            >
              <X size={17} />
            </button>

            <div className="mb-8 flex justify-center">
              <div className="relative flex h-32 w-32 items-center justify-center">
                {listening && (
                  <>
                    <div
                      className="absolute h-28 w-28 rounded-full bg-[#1300BA] blur-xl animate-[voiceGlow_2.4s_ease-in-out_infinite]"
                    />
                    <div
                      className="absolute h-28 w-28 rounded-full border border-[#1300BA]/20 bg-[#1300BA]/[0.025] shadow-[inset_0_0_20px_rgba(255,255,255,0.9),0_0_30px_rgba(19,0,186,0.08)] backdrop-blur-xl animate-[voiceRing_2.4s_ease-out_infinite]"
                    />
                    <div
                      className="absolute h-24 w-24 rounded-full border border-[#1300BA]/25 bg-[#1300BA]/[0.04] shadow-[inset_0_0_16px_rgba(255,255,255,0.95),0_0_24px_rgba(19,0,186,0.1)] backdrop-blur-xl animate-[voiceRing_2.4s_ease-out_0.8s_infinite]"
                    />
                    <div
                      className="absolute h-20 w-20 rounded-full border border-[#1300BA]/30 bg-white/25 shadow-[0_0_22px_rgba(19,0,186,0.12)] backdrop-blur-md animate-[voiceCore_1.8s_ease-in-out_infinite]"
                    />
                  </>
                )}

                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white backdrop-blur-xl">
                  <Image
                    src="/arbyter-logo.svg"
                    alt="Arbyter"
                    width={52}
                    height={52}
                    priority
                  />
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold tracking-[-0.04em]">
              {listening ? 'Listening...' : 'Ready'}
            </h3>

            <p className="mt-3 text-[17px] leading-[1.47] tracking-[-0.022em] text-black/60">
              Tell Arbyter what you want your AI workforce to do.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setListening(!listening)}
                className="flex h-14 w-14 items-center justify-center rounded-full text-white transition-transform active:scale-[0.97]"
                style={{ background: BLUE }}
              >
                {listening ? <MicOff size={21} /> : <Mic size={21} />}
              </button>
            </div>

            <p className="mt-5 text-xs text-black/45">
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
      className={`group flex h-11 items-center gap-2 rounded-full px-3 transition-all ${
        active
          ? 'text-white'
          : 'text-black/48 hover:bg-black/[0.05] hover:text-black/75'
      }`}
      style={active ? { background: BLUE } : undefined}
    >
      {icon}

      <span
        className={`hidden text-[12px] font-normal tracking-[-0.01em] sm:block ${
          active ? 'text-white' : ''
        }`}
      >
        {label}
      </span>
    </a>
  )
}