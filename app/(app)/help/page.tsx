'use client'

import * as React from 'react'
import {
  ArrowRight,
  BookOpen,
  Bot,
  CircleHelp,
  FileText,
  LifeBuoy,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

const helpTopics = [
  {
    title: 'Getting Started',
    description: 'Learn how to set up your AI governance environment.',
    icon: BookOpen,
  },
  {
    title: 'AI Governance',
    description: 'Understand risks, policies, controls, and compliance.',
    icon: ShieldCheck,
  },
  {
    title: 'Agents & Tasks',
    description: 'Manage AI agents and assign governed tasks.',
    icon: Bot,
  },
  {
    title: 'Reports & Evidence',
    description: 'Learn how reporting and governance evidence work.',
    icon: FileText,
  },
]

const popularQuestions = [
  'How do I add an AI agent?',
  'How are AI risks assessed?',
  'How do I create a governance policy?',
  'How do controls enforce policies?',
  'How do I generate a compliance report?',
]

export default function HelpPage() {
  const [search, setSearch] = React.useState('')

  const filteredQuestions = popularQuestions.filter((question) =>
    question.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="flex flex-col gap-6">
      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border bg-background">
            <CircleHelp className="h-6 w-6" />
          </div>

          <p className="mt-5 text-sm font-medium text-muted-foreground">
            Arbyter Support
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            How can we help?
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Find answers, learn how Arbyter works, and get help managing your
            AI governance environment.
          </p>

          <div className="relative mx-auto mt-6 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search help articles..."
              className="h-11 w-full rounded-xl border bg-background pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-semibold">
            Explore Arbyter
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Learn how the main parts of your governance environment work.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {helpTopics.map((topic) => {
            const Icon = topic.icon

            return (
              <button
                key={topic.title}
                type="button"
                className="group rounded-xl border bg-card p-5 text-left transition hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                    <Icon className="h-5 w-5" />
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>

                <h3 className="mt-4 font-semibold">
                  {topic.title}
                </h3>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {topic.description}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="font-semibold">
            Popular Questions
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Quick answers to common Arbyter questions.
          </p>
        </div>

        <div className="divide-y">
          {filteredQuestions.map((question) => (
            <button
              key={question}
              type="button"
              className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm transition hover:bg-muted/20"
            >
              <span>{question}</span>

              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}

          {filteredQuestions.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No help articles match your search.
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border">
            <Sparkles className="h-5 w-5" />
          </div>

          <h2 className="mt-4 font-semibold">
            Ask Arbyter
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Ask questions about your governance environment and get contextual
            guidance from Arbyter.
          </p>

          <button
            type="button"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
          >
            <MessageSquare className="h-4 w-4" />
            Ask a Question
          </button>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border">
            <LifeBuoy className="h-5 w-5" />
          </div>

          <h2 className="mt-4 font-semibold">
            Contact Support
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Need help with your workspace? Contact the Arbyter support team.
          </p>

          <button
            type="button"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
          >
            Contact Support
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">
              Arbyter OS
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              ORCHESTRATE. GOVERN. SECURE.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Help Center · Documentation · Support
          </p>
        </div>
      </section>
    </main>
  )
}