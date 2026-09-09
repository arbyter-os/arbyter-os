"use client";

import { FormEvent, useState } from "react";

export default function AgentMailTestPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Arbyter AgentMail Test");
  const [text, setText] = useState(
    "This is a test email sent through Arbyter."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/agentmail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          subject,
          text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to send email.");
      }

      setResult({
        success: true,
        message: "Email sent successfully through AgentMail.",
      });
    } catch (error) {
      setResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground">
            Arbyter OS
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            AgentMail Test
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Test the Creator AI AgentMail connection.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Recipient
            </label>

            <input
              type="email"
              required
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Subject
            </label>

            <input
              type="text"
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Message
            </label>

            <textarea
              required
              rows={6}
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Test Email"}
          </button>

          {result && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                result.success
                  ? "border-green-500/30 bg-green-500/10"
                  : "border-red-500/30 bg-red-500/10"
              }`}
            >
              {result.message}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}