'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Bell,
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  Save,
  Shield,
  User,
} from 'lucide-react'

export default function SettingsPage() {
  const [saved, setSaved] = React.useState(false)
  const [notifications, setNotifications] = React.useState(true)
  const [criticalAlerts, setCriticalAlerts] = React.useState(true)
  const [weeklyReports, setWeeklyReports] = React.useState(false)
  const [mfaStatus, setMfaStatus] = React.useState<'loading' | 'not-enrolled' | 'enrolled' | 'enrolling' | 'verifying'>('loading')
  const [mfaQrCode, setMfaQrCode] = React.useState<string | null>(null)
  const [mfaSecret, setMfaSecret] = React.useState<string | null>(null)
  const [mfaFactorId, setMfaFactorId] = React.useState<string | null>(null)
  const [mfaCode, setMfaCode] = React.useState('')
  const [mfaError, setMfaError] = React.useState<string | null>(null)
  const [mfaBusy, setMfaBusy] = React.useState(false)

  const supabase = React.useMemo(() => createClient(), [])

  async function refreshMfaStatus() {
    setMfaError(null)
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      setMfaError('Unable to check two-factor authentication status.')
      setMfaStatus('not-enrolled')
      return
    }
    const verifiedTotp = data.totp?.find((factor) => factor.status === 'verified')
    setMfaStatus(verifiedTotp ? 'enrolled' : 'not-enrolled')
    if (verifiedTotp) {
      setMfaFactorId(verifiedTotp.id)
    }
  }

  React.useEffect(() => {
    void refreshMfaStatus()
  }, [])

  async function beginMfaEnrollment() {
    setMfaBusy(true)
    setMfaError(null)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Arbyter Authenticator',
      })
      if (error || !data) throw error ?? new Error('Enrollment failed.')
      setMfaFactorId(data.id)
      setMfaQrCode(data.totp.qr_code)
      setMfaSecret(data.totp.secret)
      setMfaStatus('enrolling')
    } catch {
      setMfaError('Unable to start two-factor enrollment. Please try again.')
    } finally {
      setMfaBusy(false)
    }
  }

  async function verifyMfaEnrollment() {
    if (!mfaFactorId || !/^\d{6}$/.test(mfaCode)) {
      setMfaError('Enter the 6-digit code from your authenticator app.')
      return
    }
    setMfaBusy(true)
    setMfaError(null)
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
      if (challengeError || !challenge) throw challengeError ?? new Error('Challenge failed.')
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode,
      })
      if (verifyError) throw verifyError
      setMfaQrCode(null)
      setMfaSecret(null)
      setMfaCode('')
      setMfaStatus('enrolled')
    } catch {
      setMfaError('The verification code was invalid or the factor could not be verified.')
    } finally {
      setMfaBusy(false)
    }
  }

  function handleSave() {
    setSaved(true)

    window.setTimeout(() => {
      setSaved(false)
    }, 2500)
  }

  return (
    <main className="flex flex-col gap-6">
      <section>
        <p className="text-sm font-medium text-muted-foreground">
          Workspace Configuration
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Settings
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manage your organization, governance environment, notifications,
          security, and account preferences.
        </p>
      </section>

      {saved && (
        <div className="flex items-center gap-2 content-surface rounded-xl px-4 py-3 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          Settings saved successfully.
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="content-surface rounded-xl p-2">
          <nav className="space-y-1">
            <a
              href="#organization"
              className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium"
            >
              <Building2 className="h-4 w-4" />
              Organization
            </a>

            <a
              href="#account"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <User className="h-4 w-4" />
              Account
            </a>

            <a
              href="#notifications"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </a>

            <a
              href="#security"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Lock className="h-4 w-4" />
              Security
            </a>

            <a
              href="#api"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <KeyRound className="h-4 w-4" />
              API & Integrations
            </a>
          </nav>
        </aside>

        <div className="flex flex-col gap-6">
          <section
            id="organization"
            className="scroll-mt-6 content-surface rounded-xl"
          >
            <div className="border-b p-5">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5" />

                <div>
                  <h2 className="font-semibold">
                    Organization
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Configure your Arbyter governance workspace.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Organization name
                </label>

                <input
                  type="text"
                  defaultValue="Arbyter Workspace"
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Workspace URL
                </label>

                <div className="flex">
                  <span className="flex h-10 items-center rounded-l-lg border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                    arbyter.app/
                  </span>

                  <input
                    type="text"
                    defaultValue="workspace"
                    className="h-10 min-w-0 flex-1 rounded-r-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Industry
                </label>

                <select className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none">
                  <option>Technology</option>
                  <option>Financial Services</option>
                  <option>Healthcare</option>
                  <option>Insurance</option>
                  <option>Retail</option>
                  <option>Professional Services</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </section>

          <section
            id="account"
            className="scroll-mt-6 content-surface rounded-xl"
          >
            <div className="border-b p-5">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5" />

                <div>
                  <h2 className="font-semibold">
                    Account
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage your workspace profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    First name
                  </label>

                  <input
                    type="text"
                    defaultValue="Arbyter"
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Last name
                  </label>

                  <input
                    type="text"
                    defaultValue="Admin"
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  defaultValue="admin@arbyter.app"
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Role
                </label>

                <input
                  type="text"
                  value="Workspace Administrator"
                  readOnly
                  className="h-10 w-full rounded-lg border bg-muted px-3 text-sm text-muted-foreground outline-none"
                />
              </div>
            </div>
          </section>

          <section
            id="notifications"
            className="scroll-mt-6 content-surface rounded-xl"
          >
            <div className="border-b p-5">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5" />

                <div>
                  <h2 className="font-semibold">
                    Notifications
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose which governance events should notify you.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y">
              <label className="flex cursor-pointer items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm font-medium">
                    Governance notifications
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Receive important updates about your AI environment.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(event) =>
                    setNotifications(event.target.checked)
                  }
                  className="h-4 w-4"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm font-medium">
                    Critical risk alerts
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Get notified when critical AI risks require attention.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={criticalAlerts}
                  onChange={(event) =>
                    setCriticalAlerts(event.target.checked)
                  }
                  className="h-4 w-4"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm font-medium">
                    Weekly governance summary
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Receive a weekly summary of risks, controls, and activity.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={weeklyReports}
                  onChange={(event) =>
                    setWeeklyReports(event.target.checked)
                  }
                  className="h-4 w-4"
                />
              </label>
            </div>
          </section>

          <section
            id="security"
            className="scroll-mt-6 content-surface rounded-xl"
          >
            <div className="border-b p-5">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5" />

                <div>
                  <h2 className="font-semibold">
                    Security
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Security configuration for your governance workspace.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y">
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Two-factor authentication
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Add another layer of protection to administrator accounts.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => { void beginMfaEnrollment() }}
                    disabled={mfaBusy || mfaStatus === 'enrolled'}
                    className="h-9 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {mfaStatus === 'enrolled' ? 'Enabled' : 'Configure'}
                  </button>
                  {mfaStatus === 'enrolling' && (
                    <div className="w-full max-w-sm rounded-lg border bg-background p-4 text-left sm:w-80">
                      <p className="text-sm font-medium">Scan the QR code</p>
                      {mfaQrCode && <img src={mfaQrCode} alt="Authenticator enrollment QR code" className="mx-auto my-3 h-48 w-48" />}
                      {mfaSecret && (
                        <p className="break-all text-xs text-muted-foreground">Manual key: {mfaSecret}</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <input
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={mfaCode}
                          onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="6-digit code"
                          className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={() => { void verifyMfaEnrollment() }}
                          disabled={mfaBusy || mfaCode.length !== 6}
                          className="h-9 rounded-lg bg-foreground px-3 text-sm font-medium text-background disabled:opacity-50"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}
                  {mfaError && <p className="max-w-sm text-xs text-destructive">{mfaError}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Active sessions
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    1 active administrator session.
                  </p>
                </div>

                <button
                  type="button"
                  className="h-9 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
                >
                  Manage
                </button>
              </div>
            </div>
          </section>

          <section
            id="api"
            className="scroll-mt-6 content-surface rounded-xl"
          >
            <div className="border-b p-5">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5" />

                <div>
                  <h2 className="font-semibold">
                    API & Integrations
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Connect Arbyter with your AI systems and enterprise tools.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="rounded-xl border bg-muted/20 p-5">
                <p className="text-sm font-medium">
                  Integrations are not configured yet.
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  API keys, agent connections, webhooks, and external
                  integrations will be configured here in a later phase.
                </p>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}