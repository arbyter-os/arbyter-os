'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function ConnectorTestPage() {
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState(
    'Arbyter Connector Runtime Test'
  )
  const [message, setMessage] = useState(
    'This email was sent through Arbyter OS generic Connector Runtime.'
  )

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function sendTest() {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      if (!email.trim()) {
        throw new Error('Enter a recipient email address.')
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError

      if (!user) {
        throw new Error('You must be signed in.')
      }

      const { data: userRecord, error: userError } =
        await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .maybeSingle()

      if (userError) throw userError

      if (!userRecord?.organization_id) {
        throw new Error(
          'No organization is associated with your account.'
        )
      }

      const { data: connection, error: connectionError } =
        await supabase
          .from('agent_connections')
          .select(
            `
              id,
              agent_id,
              provider,
              capabilities
            `
          )
          .eq(
            'organization_id',
            userRecord.organization_id
          )
          .eq('provider', 'agentmail')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

      if (connectionError) throw connectionError

      if (!connection) {
        throw new Error(
          'No AgentMail connection was found.'
        )
      }

      const capabilities =
        connection.capabilities ?? {}

      if (!capabilities['messages.send']) {
        throw new Error(
          'messages.send is not enabled for the AgentMail connection.'
        )
      }

      const response = await fetch(
        '/api/connectors/execute',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            connectionId: connection.id,
            agentId: connection.agent_id,
            action: {
              action: 'messages.send',
              payload: {
                to: email.trim(),
                subject: subject.trim(),
                text: message.trim(),
              },
            },
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.details ||
            'Connector execution failed.'
        )
      }

      setResult(
        'Success — the email was executed through Arbyter Connector Runtime.'
      )
    } catch (err) {
      console.error('Connector test failed:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Connector test failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-full bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <div>
          <div className="text-sm font-medium text-muted-foreground">
            Arbyter OS
          </div>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Connector Runtime Test
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This temporary test verifies that Arbyter can
            execute the AgentMail connector through the generic
            Connector Runtime.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="space-y-4">
            <Field label="Recipient Email">
              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="your-email@example.com"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5"
              />
            </Field>

            <Field label="Subject">
              <input
                value={subject}
                onChange={(event) =>
                  setSubject(event.target.value)
                }
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5"
              />
            </Field>

            <Field label="Message">
              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                rows={5}
                className="w-full resize-none rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5"
              />
            </Field>

            <button
              type="button"
              onClick={sendTest}
              disabled={loading}
              className="h-11 w-full rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? 'Executing Connector...'
                : 'Send Test Email'}
            </button>
          </div>

          {result && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
              {result}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border bg-muted/20 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Execution path
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Step label="Agent" />
            <Arrow />
            <Step label="Connector Runtime" />
            <Arrow />
            <Step label="AgentMail" />
            <Arrow />
            <Step label="Email" />
          </div>
        </div>
      </div>
    </main>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium">
        {label}
      </label>

      {children}
    </div>
  )
}

function Step({ label }: { label: string }) {
  return (
    <span className="rounded-full border bg-background px-3 py-1.5 font-medium">
      {label}
    </span>
  )
}

function Arrow() {
  return (
    <span className="text-muted-foreground">
      →
    </span>
  )
}