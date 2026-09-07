import { ComingSoon } from '@/components/ui/coming-soon'

export default function RisksPage() {
  return (
    <ComingSoon
      title="Risks"
      description="Identify, assess, and track AI risk exposures across your environment — with severity scoring, ownership, and remediation status."
    />
  )
}
    <button
      onClick={() => setShowNewRisk(true)}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
    >
      <Plus className="h-4 w-4" />
      New Risk
    </button>
  </div>

  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
    {[
      ['Total Risks', counts.total],
      ['Critical', counts.critical],
      ['High', counts.high],
      ['Medium', counts.medium],
    ].map(([label, value]) => (
      <div
        key={label}
        className="rounded-xl border bg-card p-5"
      >
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight">
          {value}
        </p>
      </div>
    ))}
  </div>

  <div className="rounded-xl border bg-card">
    <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search risks..."
          className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        />
      </div>

      <select
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
        className="h-10 rounded-lg border bg-background px-3 text-sm outline-none"
      >
        <option>All</option>
        <option>Critical</option>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b bg-muted/30 text-left text-xs font-medium text-muted-foreground">
            <th className="px-5 py-3">Risk</th>
            <th className="px-5 py-3">AI System</th>
            <th className="px-5 py-3">Category</th>
            <th className="px-5 py-3">Severity</th>
            <th className="px-5 py-3">Owner</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Last Reviewed</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>

        <tbody>
          {filteredRisks.map((risk) => (
            <tr
              key={risk.id}
              className="border-b last:border-0 transition hover:bg-muted/20"
            >
              <td className="px-5 py-4 font-medium">{risk.name}</td>
              <td className="px-5 py-4 text-muted-foreground">
                {risk.system}
              </td>
              <td className="px-5 py-4 text-muted-foreground">
                {risk.category}
              </td>
              <td className="px-5 py-4">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(
                    risk.severity
                  )}`}
                >
                  {risk.severity}
                </span>
              </td>
              <td className="px-5 py-4 text-muted-foreground">
                {risk.owner}
              </td>
              <td className="px-5 py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                    risk.status
                  )}`}
                >
                  {risk.status}
                </span>
              </td>
              <td className="px-5 py-4 text-muted-foreground">
                {risk.reviewed}
              </td>
              <td className="px-3 py-4">
                <button className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}

          {filteredRisks.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="px-5 py-12 text-center text-sm text-muted-foreground"
              >
                No risks match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>

  {showNewRisk && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-xl">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">New Risk</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a risk to the AI governance environment.
          </p>
        </div>

        <div className="space-y-4">
          <input
            placeholder="Risk name"
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none"
          />

          <textarea
            placeholder="Description"
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
          />

          <input
            placeholder="AI system"
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none"
          />

          <select className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none">
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setShowNewRisk(false)}
            className="h-10 rounded-lg border px-4 text-sm font-medium"
          >
            Cancel
          </button>

          <button
            onClick={() => setShowNewRisk(false)}
            className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
          >
            Create Risk
          </button>
        </div>
      </div>
    </div>
  )}
</div>