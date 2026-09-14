'use client'

import * as React from 'react'

import { PageHeader } from '@/components/dashboard/page-header'
import { Panel } from '@/components/dashboard/panel'
import ApprovalList from '@/components/dashboard/approval-list'
import { loadPendingApprovals } from '@/lib/approvals/client'
import type { Approval } from '@/lib/approvals/types'

export default function ApprovalsPage() {
  const [approvals, setApprovals] =
    React.useState<Approval[]>([])
  const [loading, setLoading] =
    React.useState(true)
  const [error, setError] =
    React.useState<string | null>(null)

  async function loadApprovals() {
    try {
      setLoading(true)
      setError(null)

      const pending =
        await loadPendingApprovals()

      setApprovals(pending)
    } catch (error) {
      console.error(
        'Failed to load approvals:',
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load approvals.'
      )
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadApprovals()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        greeting="Governance"
        title="Approvals"
        description="Review and authorize AI agent actions that require human oversight."
      />

      <Panel
        title="Pending Approvals"
        description={`${approvals.length} ${
          approvals.length === 1
            ? 'action'
            : 'actions'
        } waiting for review`}
        bodyClassName="pt-1"
      >
        {loading ? (
          <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 text-sm text-black/50">
            Loading approvals...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <ApprovalList
            approvals={approvals}
            onResolved={loadApprovals}
          />
        )}
      </Panel>
    </div>
  )
} 