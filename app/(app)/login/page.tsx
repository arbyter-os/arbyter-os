"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaCode, setMfaCode] = useState("")
  const [mfaBusy, setMfaBusy] = useState(false)

  const supabase = createClient()

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      setError(typeof payload?.error === "string" ? payload.error : "Unable to sign in.")
      setLoading(false)
      return
    }

    const payload = await response.json().catch(() => null)
    if (payload?.mfaRequired === true) {
      setMfaRequired(true)
      setLoading(false)
      setError("")
      return
    }

    router.push("/overview")
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Sign in to Arbyter</h1>
          <p className="mt-2 text-muted-foreground">
            AI orchestrated.
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border px-4 py-3"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border px-4 py-3"
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {mfaRequired && (
            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <p className="font-medium">Two-factor authentication required</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app to continue.
                </p>
              </div>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-lg border px-4 py-3"
                placeholder="123456"
              />
              <button
                type="button"
                disabled={mfaBusy || !/^\d{6}$/.test(mfaCode)}
                onClick={async () => {
                  setMfaBusy(true)
                  setError("")
                  try {
                    const { data, error: factorError } = await supabase.auth.mfa.listFactors()
                    if (factorError) throw factorError
                    const factor = data.totp?.find((item) => item.status === "verified")
                    if (!factor) throw new Error("No verified MFA factor found.")
                    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id })
                    if (challengeError || !challenge) throw challengeError ?? new Error("Challenge failed.")
                    const { error: verifyError } = await supabase.auth.mfa.verify({
                      factorId: factor.id,
                      challengeId: challenge.id,
                      code: mfaCode,
                    })
                    if (verifyError) throw verifyError
                    router.push("/overview")
                    router.refresh()
                  } catch {
                    setError("The verification code was invalid. Please try again.")
                  } finally {
                    setMfaBusy(false)
                  }
                }}
                className="w-full rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50"
              >
                {mfaBusy ? "Verifying..." : "Verify code"}
              </button>
            </div>
          )}
        </div>
      </form>
    </main>
  )
}