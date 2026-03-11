"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Status = "Planning" | "In Progress" | "On Hold";
type InviteTiming = "now" | "later" | null;

function isValidEmail(email: string) {
  if (!email.trim()) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-900">{children}</label>
      {required ? (
        <span className="text-xs font-medium text-gray-400">Required</span>
      ) : null}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs font-medium text-rose-600">{children}</p>;
}

export function ProjectCreateForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [inviteTiming, setInviteTiming] = useState<InviteTiming>(null);
  const [emails, setEmails] = useState<string[]>([""]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    status: false,
    inviteTiming: false,
    emails: [false] as boolean[],
  });

  const errors = useMemo(() => {
    const errs: string[] = [];
    if (!name.trim()) errs.push("Project name is required.");
    if (!status) errs.push("Status is required.");
    if (inviteTiming === null)
      errs.push("Please choose whether to invite teammates now or later.");
    if (inviteTiming === "now") {
      const trimmed = emails.map((e) => e.trim());
      if (!trimmed.some(Boolean)) errs.push("Add at least one teammate email.");
      const invalid = trimmed.filter(Boolean).some((e) => !isValidEmail(e));
      if (invalid) errs.push("One or more teammate emails are invalid.");
    }
    return errs;
  }, [name, status, inviteTiming, emails]);

  const canCreate = errors.length === 0;

  function onCreate() {
    setAttemptedSubmit(true);
    if (!canCreate) return;
    router.push("/dashboard");
  }

  function addEmail() {
    setEmails((prev) => [...prev, ""]);
    setTouched((t) => ({ ...t, emails: [...t.emails, false] }));
  }

  function removeEmail(index: number) {
    setEmails((prev) => prev.filter((_, i) => i !== index));
    setTouched((t) => ({ ...t, emails: t.emails.filter((_, i) => i !== index) }));
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/create-workspace"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-700 transition"
          >
            <span aria-hidden>←</span>
            Back to workspace selection
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
          >
            Dashboard
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Create Project Workspace
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Set up a project and invite teammates when you’re ready.
              </p>
            </div>
            <div className="rounded-full border border-indigo-600 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              Step 1 of 1
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel required>Project Name</FieldLabel>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Project name"
              />
              {(attemptedSubmit || touched.name) && !name.trim() ? (
                <FieldError>This field is required</FieldError>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Description</FieldLabel>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Optional description"
                rows={4}
              />
            </div>

            <div>
              <FieldLabel>Start Date</FieldLabel>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <FieldLabel>End Date / Deadline</FieldLabel>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel required>Status</FieldLabel>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                onBlur={() => setTouched((t) => ({ ...t, status: true }))}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select status</option>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
              </select>
              {(attemptedSubmit || touched.status) && !status ? (
                <FieldError>This field is required</FieldError>
              ) : null}
            </div>
          </div>

          <div className="mt-8">
            <div className="text-sm font-semibold text-gray-900">
              Would you like to invite teammates now or later?
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setInviteTiming("now");
                  setTouched((t) => ({ ...t, inviteTiming: true }));
                }}
                className={[
                  "text-left rounded-2xl border p-5 transition",
                  inviteTiming === "now"
                    ? "border-indigo-600 bg-indigo-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-indigo-200 hover:shadow-sm",
                ].join(" ")}
              >
                <div className="text-sm font-semibold text-gray-900">
                  Invite Now
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Add up to 5 teammate email addresses.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInviteTiming("later");
                  setTouched((t) => ({ ...t, inviteTiming: true }));
                }}
                className={[
                  "text-left rounded-2xl border p-5 transition",
                  inviteTiming === "later"
                    ? "border-indigo-600 bg-indigo-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-indigo-200 hover:shadow-sm",
                ].join(" ")}
              >
                <div className="text-sm font-semibold text-gray-900">
                  Invite Later
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Continue without sending invites.
                </div>
              </button>
            </div>
            {(attemptedSubmit || touched.inviteTiming) && inviteTiming === null ? (
              <FieldError>This field is required</FieldError>
            ) : null}

            {inviteTiming === "now" ? (
              <div className="mt-6">
                <div className="space-y-4">
                  {emails.map((email, idx) => {
                    const trimmed = email.trim();
                    const isTouched = touched.emails[idx] ?? false;
                    const show = attemptedSubmit || isTouched;
                    const isRequiredError =
                      show && emails.map((e) => e.trim()).every((e) => !e) && !trimmed;
                    const isInvalidError = show && !!trimmed && !isValidEmail(trimmed);

                    return (
                      <div key={idx}>
                        <FieldLabel>Teammate email</FieldLabel>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            value={email}
                            onChange={(e) =>
                              setEmails((prev) =>
                                prev.map((v, i) => (i === idx ? e.target.value : v)),
                              )
                            }
                            onBlur={() =>
                              setTouched((t) => ({
                                ...t,
                                emails: t.emails.map((v, i) => (i === idx ? true : v)),
                              }))
                            }
                            className={[
                              "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
                              isInvalidError
                                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-400/20"
                                : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20",
                            ].join(" ")}
                            placeholder="name@example.com"
                          />

                          {emails.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeEmail(idx)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
                              aria-label="Remove email"
                            >
                              ✕
                            </button>
                          ) : null}
                        </div>

                        {isRequiredError ? (
                          <FieldError>This field is required</FieldError>
                        ) : isInvalidError ? (
                          <FieldError>Enter a valid email</FieldError>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={addEmail}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:bg-indigo-50 transition"
                >
                  + Add another teammate
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/create-workspace"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                <span aria-hidden>←</span>
                Back
              </Link>

              <button
                type="button"
                onClick={onCreate}
                disabled={!canCreate}
                className={[
                  "inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition",
                  canCreate
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-indigo-200 text-white cursor-not-allowed",
                ].join(" ")}
              >
                Create Project
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-gray-400">
              We’ll connect this to your database next.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

