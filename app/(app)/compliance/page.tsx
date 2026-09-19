'use client'

import * as React from 'react'
import { CheckCircle2, AlertTriangle, Clock3, ChevronRight } from 'lucide-react'

type Framework = {
  name: string
  description: string
  coverage: number
  status: 'Healthy' | 'Attention'
}

const frameworks: Framework[] = [
  {
    name: 'EU AI Act',
    description: 'AI system obligations, risk classification, and documentation',
    coverage: 82,
    status: 'Attention',
  },
  {
    name: 'NIST AI RMF',
    description: 'AI risk management and governance controls',
    coverage: 91,
    status: 'Healthy',
  },
  {
    name: 'ISO/IEC 42001',
    description: 'AI management system requirements and controls',
    coverage: 76,
    status: 'Attention',
  },
]

const gaps = [
  {
    title: 'Human oversight documentation',
    framework: 'EU AI Act',
    severity: 'High',
    due: 'Sep 14, 2026',
  },
  {
    title: 'Model monitoring evidence',
    framework: 'NIST AI RMF',
    severity: 'Medium',
    due: 'Sep 21, 2026',
  },
  {
    title: 'AI inventory approval',
    framework: 'ISO/IEC 42001',
    severity: 'Medium',
    due: 'Sep 28, 2026',
  },
]

function severityClass(severity: string) {
  if (severity === 'High') {
    return 'border-orange-200 bg-orange-50 text-orange-700'
  }

  return 'border-yellow-200 bg-yellow-50 text-yellow-700'
}

export default function CompliancePage() {
  const [showFrameworks, setShowFrameworks] = React.useState(false)

  return (
    <main className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Governance & Compliance
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Compliance
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Monitor regulatory readiness, control coverage, evidence, and compliance gaps across your AI environment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowFrameworks(!showFrameworks)}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
        >
          {showFrameworks ? 'Hide Frameworks' : 'View Frameworks'}
        </button>
      </section>

      {/* Compliance score */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Compliance Score
            </p>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            86%
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Overall governance readiness
          </p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Controls Covered
            </p>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            47 / 54
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            7 controls need attention
          </p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Open Gaps
            </p>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            7
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            2 high-priority gaps
          </p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Upcoming
            </p>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            3
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Compliance tasks due soon
          </p>
        </div>
      </section>

      {/* Frameworks */}
      {showFrameworks && (
        <section className="glass rounded-2xl">
          <div className="border-b p-5">
            <h2 className="font-semibold">
              Compliance Frameworks
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Track readiness across the frameworks that matter to your organization.
            </p>
          </div>

          <div className="divide-y">
            {frameworks.map((framework) => (
              <div
                key={framework.name}
                className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {framework.name}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        framework.status === 'Healthy'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-orange-50 text-orange-700'
                      }`}
                    >
                      {framework.status}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {framework.description}
                  </p>
                </div>

                <div className="w-full md:w-48">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Coverage
                    </span>
                    <span className="font-medium">
                      {framework.coverage}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${framework.coverage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Compliance gaps */}
      <section className="glass rounded-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-semibold">
              Compliance Gaps
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Issues that require remediation or additional evidence.
            </p>
          </div>

          <button
            type="button"
            className="hidden items-center gap-1 text-sm font-medium sm:flex"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-y">
          {gaps.map((gap) => (
            <div
              key={gap.title}
              className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h3 className="font-medium">
                  {gap.title}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {gap.framework} · Due {gap.due}
                </p>
              </div>

              <span
                className={`w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(
                  gap.severity
                )}`}
              >
                {gap.severity}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Evidence */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold">
            Evidence Collection
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Evidence gathered from your AI systems and governance controls.
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                Policies
              </span>
              <span className="text-sm font-medium">
                18 / 18
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">
                Control evidence
              </span>
              <span className="text-sm font-medium">
                31 / 36
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">
                Model documentation
              </span>
              <span className="text-sm font-medium">
                12 / 15
              </span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold">
            Compliance Activity
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Recent governance and compliance events.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm font-medium">
                Evidence automatically collected
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                14 minutes ago
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">
                EU AI Act control reviewed
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                2 hours ago
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">
                New compliance gap detected
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Yesterday
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}