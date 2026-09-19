'use client'

import * as React from 'react'
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  ShieldCheck,
} from 'lucide-react'

type Report = {
  id: number
  name: string
  type: string
  period: string
  status: 'Ready' | 'Generating' | 'Scheduled'
  created: string
  size: string
}

const initialReports: Report[] = [
  {
    id: 1,
    name: 'AI Governance Executive Report',
    type: 'Executive',
    period: 'Last 30 days',
    status: 'Ready',
    created: 'Today',
    size: '2.4 MB',
  },
  {
    id: 2,
    name: 'EU AI Act Compliance Report',
    type: 'Compliance',
    period: 'Q3 2026',
    status: 'Ready',
    created: 'Yesterday',
    size: '4.8 MB',
  },
  {
    id: 3,
    name: 'AI Risk Assessment',
    type: 'Risk',
    period: 'Q3 2026',
    status: 'Ready',
    created: 'Sep 5, 2026',
    size: '3.1 MB',
  },
  {
    id: 4,
    name: 'Agent Activity Report',
    type: 'Operations',
    period: 'Last 7 days',
    status: 'Generating',
    created: 'Sep 6, 2026',
    size: '—',
  },
  {
    id: 5,
    name: 'Control Effectiveness Report',
    type: 'Governance',
    period: 'August 2026',
    status: 'Ready',
    created: 'Sep 1, 2026',
    size: '2.7 MB',
  },
  {
    id: 6,
    name: 'Monthly Governance Summary',
    type: 'Executive',
    period: 'August 2026',
    status: 'Scheduled',
    created: 'Aug 31, 2026',
    size: '—',
  },
]

function statusClass(status: Report['status']) {
  switch (status) {
    case 'Ready':
      return 'bg-green-50 text-green-700'
    case 'Generating':
      return 'bg-yellow-50 text-yellow-700'
    default:
      return 'bg-blue-50 text-blue-700'
  }
}

export default function ReportsPage() {
  const [reports, setReports] =
    React.useState<Report[]>(initialReports)

  const [showCreate, setShowCreate] = React.useState(false)

  const [reportName, setReportName] = React.useState('')
  const [reportType, setReportType] = React.useState('Executive')
  const [reportPeriod, setReportPeriod] =
    React.useState('Last 30 days')

  function createReport() {
    if (!reportName.trim()) return

    const newReport: Report = {
      id: Date.now(),
      name: reportName,
      type: reportType,
      period: reportPeriod,
      status: 'Generating',
      created: 'Just now',
      size: '—',
    }

    setReports((current) => [newReport, ...current])
    setReportName('')
    setReportType('Executive')
    setReportPeriod('Last 30 days')
    setShowCreate(false)
  }

  return (
    <main className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Governance Intelligence
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Reports
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Generate and manage governance reports for executives,
            compliance teams, auditors, and risk owners.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create Report
        </button>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="content-surface rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total Reports
            </p>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {reports.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Generated and scheduled
          </p>
        </div>

        <div className="content-surface rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Ready
            </p>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {reports.filter((report) => report.status === 'Ready').length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Available to export
          </p>
        </div>

        <div className="content-surface rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Compliance
            </p>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            3
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Framework reports
          </p>
        </div>

        <div className="content-surface rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Scheduled
            </p>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {reports.filter(
              (report) => report.status === 'Scheduled'
            ).length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Automatic generation
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            setReportName('AI Governance Executive Report')
            setReportType('Executive')
            setReportPeriod('Last 30 days')
            setShowCreate(true)
          }}
          className="group content-surface rounded-xl p-5 text-left transition hover:bg-muted/20"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border">
            <BarChart3 className="h-5 w-5" />
          </div>

          <h2 className="mt-4 font-semibold">
            Executive Report
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            High-level governance health, risks, controls, and AI activity.
          </p>

          <p className="mt-4 text-xs font-medium">
            Generate →
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setReportName('Compliance Assessment Report')
            setReportType('Compliance')
            setReportPeriod('Q3 2026')
            setShowCreate(true)
          }}
          className="group content-surface rounded-xl p-5 text-left transition hover:bg-muted/20"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <h2 className="mt-4 font-semibold">
            Compliance Report
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Framework coverage, evidence, gaps, and remediation status.
          </p>

          <p className="mt-4 text-xs font-medium">
            Generate →
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setReportName('AI Risk Assessment')
            setReportType('Risk')
            setReportPeriod('Q3 2026')
            setShowCreate(true)
          }}
          className="group content-surface rounded-xl p-5 text-left transition hover:bg-muted/20"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border">
            <FileText className="h-5 w-5" />
          </div>

          <h2 className="mt-4 font-semibold">
            Risk Report
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            AI risk exposure, severity, ownership, and remediation progress.
          </p>

          <p className="mt-4 text-xs font-medium">
            Generate →
          </p>
        </button>
      </section>

      <section className="overflow-hidden content-surface rounded-xl">
        <div className="border-b p-5">
          <h2 className="font-semibold">
            Report Library
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Generated reports and scheduled governance documents.
          </p>
        </div>

        <div className="divide-y">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex flex-col gap-4 p-5 transition hover:bg-muted/20 lg:flex-row lg:items-center"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                <FileText className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">
                    {report.name}
                  </h3>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                      report.status
                    )}`}
                  >
                    {report.status}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Type: {report.type}
                  </span>

                  <span>
                    Period: {report.period}
                  </span>

                  <span>
                    Created: {report.created}
                  </span>

                  <span>
                    Size: {report.size}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={report.status !== 'Ready'}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="content-surface rounded-xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Automated Reporting
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Schedule recurring governance reports so stakeholders receive
              updated risk, compliance, and control information automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setReportName('Monthly Governance Summary')
              setReportType('Executive')
              setReportPeriod('Monthly')
              setShowCreate(true)
            }}
            className="h-10 shrink-0 rounded-lg border px-4 text-sm font-medium transition hover:bg-muted"
          >
            Schedule Report
          </button>
        </div>
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                Create Report
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Configure a governance report for your organization.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Report name
                </label>

                <input
                  type="text"
                  value={reportName}
                  onChange={(event) =>
                    setReportName(event.target.value)
                  }
                  placeholder="e.g. Monthly AI Governance Report"
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Report type
                </label>

                <select
                  value={reportType}
                  onChange={(event) =>
                    setReportType(event.target.value)
                  }
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none"
                >
                  <option>Executive</option>
                  <option>Compliance</option>
                  <option>Risk</option>
                  <option>Governance</option>
                  <option>Operations</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Reporting period
                </label>

                <select
                  value={reportPeriod}
                  onChange={(event) =>
                    setReportPeriod(event.target.value)
                  }
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none"
                >
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Monthly</option>
                  <option>Q3 2026</option>
                  <option>Year to date</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="h-10 rounded-lg border px-4 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createReport}
                className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
              >
                Create Report
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}