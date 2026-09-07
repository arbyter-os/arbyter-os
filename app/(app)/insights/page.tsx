'use client'

import * as React from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

type Signal = {
  title: string
  description: string
  type: 'positive' | 'warning' | 'critical'
  value: string
}

const signals: Signal[] = [
  {
    title: 'Governance posture improving',
    description:
      'Control coverage increased while high-severity governance issues decreased.',
    type: 'positive',
    value: '+8.4%',
  },
  {
    title: 'Sensitive data controls need review',
    description:
      'Coverage for sensitive-data safeguards is below the recommended threshold.',
    type: 'warning',
    value: '74%',
  },
  {
    title: 'High-impact decisions require attention',
    description:
      'Several AI decisions are operating close to the human-oversight threshold.',
    type: 'critical',
    value: '3',
  },
  {
    title: 'Agent activity is stable',
    description:
      'AI agent execution volume remains within the expected operating range.',
    type: 'positive',
    value: 'Stable',
  },
]

const frameworks = [
  {
    name: 'EU AI Act',
    coverage: 89,
    controls: 18,
  },
  {
    name: 'NIST AI RMF',
    coverage: 84,
    controls: 21,
  },
  {
    name: 'ISO/IEC 42001',
    coverage: 81,
    controls: 15,
  },
]

const activity = [
  {
    label: 'AI decisions reviewed',
    value: '1,284',
    change: '+12.6%',
    positive: true,
  },
  {
    label: 'Policy violations',
    value: '18',
    change: '-21.7%',
    positive: true,
  },
  {
    label: 'Controls evaluated',
    value: '436',
    change: '+8.2%',
    positive: true,
  },
  {
    label: 'Evidence collected',
    value: '192',
    change: '+14.1%',
    positive: true,
  },
]

function signalIcon(type: Signal['type']) {
  if (type === 'positive') {
    return <CheckCircle2 className="h-5 w-5" />
  }

  if (type === 'critical') {
    return <AlertTriangle className="h-5 w-5" />
  }

  return <ShieldCheck className="h-5 w-5" />
}

function signalClass(type: Signal['type']) {
  if (type === 'positive') {
    return 'bg-green-50 text-green-700'
  }

  if (type === 'critical') {
    return 'bg-red-50 text-red-700'
  }

  return 'bg-yellow-50 text-yellow-700'
}

export default function InsightsPage() {
  return (
    <main className="flex flex-col gap-6">
      <section>
        <p className="text-sm font-medium text-muted-foreground">
          Intelligence & Analytics
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Insights
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Understand what is changing across your AI environment and identify
          where governance attention is needed.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Governance Health
            </p>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-3xl font-semibold">
            86
            <span className="text-base font-medium text-muted-foreground">
              /100
            </span>
          </p>

          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-green-700">
            <ArrowUpRight className="h-3.5 w-3.5" />
            8.4% this month
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Risk Exposure
            </p>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-3xl font-semibold">
            14.2
          </p>

          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-green-700">
            <ArrowDownRight className="h-3.5 w-3.5" />
            6.8% lower
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Control Effectiveness
            </p>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-3xl font-semibold">
            82%
          </p>

          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-green-700">
            <TrendingUp className="h-3.5 w-3.5" />
            5.2% improvement
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Active AI Agents
            </p>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-3xl font-semibold">
            24
          </p>

          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            1,284 decisions monitored
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">
              Governance Intelligence
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Signals automatically surfaced from your governance environment.
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium sm:flex">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Live environment
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {signals.map((signal) => (
            <div
              key={signal.title}
              className="flex items-start gap-4 rounded-xl border p-4 transition hover:bg-muted/20"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${signalClass(
                  signal.type
                )}`}
              >
                {signalIcon(signal.type)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">
                    {signal.title}
                  </h3>

                  <span className="text-sm font-semibold">
                    {signal.value}
                  </span>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {signal.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div>
            <h2 className="font-semibold">
              Governance Activity
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Activity across your AI governance environment.
            </p>
          </div>

          <div className="mt-5 divide-y">
            {activity.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">
                    {item.label}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Last 30 days
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold">
                    {item.value}
                  </p>

                  <p className="mt-1 text-xs font-medium text-green-700">
                    {item.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div>
            <h2 className="font-semibold">
              Framework Posture
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Current control coverage across major frameworks.
            </p>
          </div>

          <div className="mt-5 space-y-5">
            {frameworks.map((framework) => (
              <div key={framework.name}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {framework.name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {framework.controls} mapped controls
                    </p>
                  </div>

                  <p className="text-sm font-semibold">
                    {framework.coverage}%
                  </p>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${framework.coverage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <div>
          <h2 className="font-semibold">
            Executive Takeaway
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            The most important governance signal right now.
          </p>
        </div>

        <div className="mt-5 rounded-xl border bg-muted/20 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
              <TrendingUp className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold">
                Governance is trending in the right direction.
              </h3>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Overall governance health has improved over the last 30 days,
                driven by stronger control coverage and fewer policy violations.
                The next priority should be improving sensitive-data controls
                and reviewing high-impact AI decisions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}