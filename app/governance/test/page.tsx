"use client"

import { useState } from "react"

export default function GovernanceTestPage() {
  const [action, setAction] = useState("send_email")
  const [tool, setTool] = useState("email")
  const [country, setCountry] = useState("India")
  const [sector, setSector] = useState("")
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  async function evaluate() {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/governance/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          tool,
          country,
          sector,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        error:
          error instanceof Error
            ? error.message
            : "Request failed.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <p className="mb-2 text-sm text-neutral-500">
            ARBYTER OS
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            Governance Test
          </h1>

          <p className="mt-3 text-neutral-500">
            Evaluate an action against the active governance rules.
          </p>
        </div>

        <div className="space-y-5 rounded-2xl border border-neutral-200 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Action
            </label>

            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Tool
            </label>

            <input
              value={tool}
              onChange={(e) => setTool(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Country
            </label>

            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Sector
            </label>

            <input
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <button
            onClick={evaluate}
            disabled={loading}
            className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Evaluating..." : "Evaluate Action"}
          </button>
        </div>

        {result !== null && (
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Governance Result
            </h2>

            <pre className="overflow-x-auto whitespace-pre-wrap text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  )
}