"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type WorkspaceKind = "business" | "organization";

type Industry =
  | "Technology"
  | "Finance"
  | "Healthcare"
  | "Education"
  | "Retail"
  | "Manufacturing"
  | "Consulting"
  | "Media"
  | "Real Estate"
  | "Other";

type Employees = "Just me" | "2-10" | "11-50" | "51-200" | "200+";
type Currency = "USD" | "EUR" | "GBP" | "KES" | "UGX" | "ZAR" | "NGN" | "Other";
type Ownership = "sole" | "multiple" | null;
type InviteTiming = "now" | "later" | null;

const INDUSTRIES: Industry[] = [
  "Technology", "Finance", "Healthcare", "Education", "Retail",
  "Manufacturing", "Consulting", "Media", "Real Estate", "Other",
];

const EMPLOYEES: Employees[] = ["Just me", "2-10", "11-50", "51-200", "200+"];
const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "KES", "UGX", "ZAR", "NGN", "Other"];

const COUNTRIES: string[] = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Congo-Brazzaville)", "Costa Rica", "Côte d'Ivoire", "Croatia", "Cuba",
  "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti",
  "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji",
  "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece",
  "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya",
  "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia",
  "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
  "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru", "Nepal", "Netherlands",
  "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
  "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
  "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo",
  "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe",
];

function isValidEmail(email: string) {
  if (!email.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function StepPill({ active, label }: { active: boolean; label: string }) {
  return (
    <div className={[
      "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
      active ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-500",
    ].join(" ")}>
      <span className={["h-2 w-2 rounded-full", active ? "bg-indigo-600" : "bg-gray-300"].join(" ")} aria-hidden />
      {label}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs font-medium text-rose-600">{children}</p>;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-900">{children}</label>
      {required ? <span className="text-xs font-medium text-gray-400">Required</span> : null}
    </div>
  );
}

export function BusinessOrgWorkspaceWizard({ kind }: { kind: WorkspaceKind }) {
  const router = useRouter();

  const kindLabel = kind === "business" ? "Business" : "Organization";
  const pageTitle = `Create ${kindLabel} Workspace`;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 1
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState<Industry | "">("");
  const [industryOther, setIndustryOther] = useState("");
  const [country, setCountry] = useState("");
  const [employees, setEmployees] = useState<Employees | "">("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState<Currency | "">("");

  // Step 2
  const [ownership, setOwnership] = useState<Ownership>(null);

  // Step 3
  const [inviteTiming, setInviteTiming] = useState<InviteTiming>(null);
  const [coOwnerEmails, setCoOwnerEmails] = useState<string[]>([""]);

  const [touched, setTouched] = useState({
    name: false,
    industry: false,
    industryOther: false,
    country: false,
    employees: false,
    currency: false,
    ownership: false,
    inviteTiming: false,
    coOwnerEmails: [false] as boolean[],
  });

  const effectiveIndustry = useMemo(() => {
    if (industry !== "Other") return industry;
    return industryOther.trim() ? industryOther.trim() : "Other";
  }, [industry, industryOther]);

  const visibleSteps = useMemo(() => {
    return [
      { key: 1 as const, label: "Details" },
      { key: 2 as const, label: "Ownership" },
      { key: 3 as const, label: "Invite" },
      { key: 4 as const, label: "Review" },
    ];
  }, []);

  const stepIndex = useMemo(
    () => visibleSteps.findIndex((s) => s.key === step),
    [visibleSteps, step],
  );

  const currentKey = visibleSteps[Math.max(0, stepIndex)]?.key ?? 1;

  function gotoPrev() {
    const prev = visibleSteps[stepIndex - 1];
    if (prev) setStep(prev.key);
  }

  function gotoNext() {
    const next = visibleSteps[stepIndex + 1];
    if (next) setStep(next.key);
  }

  const step1Errors = useMemo(() => {
    const errs: string[] = [];
    if (!name.trim()) errs.push("name");
    if (!industry) errs.push("industry");
    if (industry === "Other" && !industryOther.trim()) errs.push("industryOther");
    if (!country) errs.push("country");
    if (!employees) errs.push("employees");
    if (!currency) errs.push("currency");
    return errs;
  }, [name, industry, industryOther, country, employees, currency]);

  const step2Errors = useMemo(() => {
    const errs: string[] = [];
    if (!ownership) errs.push("ownership");
    return errs;
  }, [ownership]);

  const showInviteStep = ownership === "multiple";

  const step3Errors = useMemo(() => {
    const errs: string[] = [];
    if (!inviteTiming) errs.push("inviteTiming");
    if (inviteTiming === "now") {
      const trimmed = coOwnerEmails.map((e) => e.trim());
      if (!trimmed.some(Boolean)) errs.push("atLeastOneEmail");
      if (trimmed.filter(Boolean).some((e) => !isValidEmail(e))) errs.push("invalidEmail");
    }
    return errs;
  }, [inviteTiming, coOwnerEmails]);

  const errorsForCurrentStep = useMemo(() => {
    if (currentKey === 1) return step1Errors;
    if (currentKey === 2) return step2Errors;
    if (currentKey === 3) return showInviteStep ? step3Errors : [];
    return [];
  }, [currentKey, step1Errors, step2Errors, step3Errors, showInviteStep]);

  const canProceed = errorsForCurrentStep.length === 0;

  function onNext() {
    setAttemptedNext(true);
    if (!canProceed) return;
    if (currentKey === 2 && ownership === "sole") { setStep(4); return; }
    if (currentKey === 3 && showInviteStep && inviteTiming === "later") { setStep(4); return; }
    gotoNext();
  }

  function onBack() {
    setAttemptedNext(false);
    if (currentKey === 1) return;
    if (currentKey === 4 && ownership === "sole") { setStep(2); return; }
    gotoPrev();
  }

  async function onCreate() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const inviteEmails =
        ownership === "multiple" && inviteTiming === "now"
          ? coOwnerEmails.map((e) => e.trim()).filter(Boolean)
          : [];

      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: kind,
          industry: effectiveIndustry,
          country,
          employees,
          currency,
          description: description.trim() || undefined,
          inviteEmails,
        }),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? "Failed to create workspace");
      }

      router.push("/dashboard");
      router.refresh();

    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  function shouldShowError(isTouched: boolean) {
    return attemptedNext || isTouched;
  }

  function addCoOwnerEmail() {
    setCoOwnerEmails((prev) => [...prev, ""]);
    setTouched((t) => ({ ...t, coOwnerEmails: [...t.coOwnerEmails, false] }));
  }

  function removeCoOwnerEmail(index: number) {
    setCoOwnerEmails((prev) => prev.filter((_, i) => i !== index));
    setTouched((t) => ({ ...t, coOwnerEmails: t.coOwnerEmails.filter((_, i) => i !== index) }));
  }

  const backHref = currentKey === 1 ? "/create-workspace" : null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/create-workspace" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-700 transition">
            <span aria-hidden>←</span> Back to workspace selection
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition">
            Dashboard
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{pageTitle}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Tell us a bit about your {kindLabel.toLowerCase()} so we can set up your workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleSteps.map((s) => (
                <StepPill key={s.key} active={s.key === currentKey} label={s.label} />
              ))}
            </div>
          </div>

          <div className="mt-6">
            {/* STEP 1 */}
            {currentKey === 1 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel required>Workspace Name</FieldLabel>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder={`${kindLabel} workspace name`}
                  />
                  {shouldShowError(touched.name) && !name.trim() && (
                    <FieldError>This field is required</FieldError>
                  )}
                </div>

                <div>
                  <FieldLabel required>Industry</FieldLabel>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value as Industry)}
                    onBlur={() => setTouched((t) => ({ ...t, industry: true }))}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                  {shouldShowError(touched.industry) && !industry && (
                    <FieldError>This field is required</FieldError>
                  )}
                </div>

                <div>
                  <FieldLabel required>Country</FieldLabel>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, country: true }))}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {shouldShowError(touched.country) && !country && (
                    <FieldError>This field is required</FieldError>
                  )}
                </div>

                {industry === "Other" && (
                  <div className="sm:col-span-2">
                    <FieldLabel required>Please specify your industry</FieldLabel>
                    <input
                      value={industryOther}
                      onChange={(e) => setIndustryOther(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, industryOther: true }))}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Type your industry"
                    />
                    {shouldShowError(touched.industryOther) && industry === "Other" && !industryOther.trim() && (
                      <FieldError>This field is required</FieldError>
                    )}
                  </div>
                )}

                <div>
                  <FieldLabel required>Number of Employees</FieldLabel>
                  <select
                    value={employees}
                    onChange={(e) => setEmployees(e.target.value as Employees)}
                    onBlur={() => setTouched((t) => ({ ...t, employees: true }))}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select size</option>
                    {EMPLOYEES.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                  {shouldShowError(touched.employees) && !employees && (
                    <FieldError>This field is required</FieldError>
                  )}
                </div>

                <div>
                  <FieldLabel required>Currency</FieldLabel>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    onBlur={() => setTouched((t) => ({ ...t, currency: true }))}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select currency</option>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {shouldShowError(touched.currency) && !currency && (
                    <FieldError>This field is required</FieldError>
                  )}
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
              </div>
            )}

            {/* STEP 2 */}
            {currentKey === 2 && (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-4">Are you the sole owner?</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { value: "sole" as const, title: "Sole Owner — I am the only owner", sub: "You can always invite others later." },
                    { value: "multiple" as const, title: "Multiple Owners — I want to add co-owners", sub: "Invite co-owners now or later." },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setOwnership(opt.value); setTouched((t) => ({ ...t, ownership: true })); }}
                      className={[
                        "text-left rounded-2xl border p-5 transition",
                        ownership === opt.value ? "border-indigo-600 bg-indigo-50 shadow-sm" : "border-gray-200 bg-white hover:border-indigo-200 hover:shadow-sm",
                      ].join(" ")}
                    >
                      <div className="text-sm font-semibold text-gray-900">{opt.title}</div>
                      <div className="mt-1 text-sm text-gray-500">{opt.sub}</div>
                    </button>
                  ))}
                </div>
                {shouldShowError(touched.ownership) && !ownership && (
                  <FieldError>Please choose an ownership option</FieldError>
                )}
              </div>
            )}

            {/* STEP 3 */}
            {currentKey === 3 && (
              showInviteStep ? (
                <div>
                  <p className="text-sm font-semibold text-gray-900">Would you like to invite your co-owners now or later?</p>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                      { value: "now" as const, title: "Invite Now", sub: "Add co-owner email addresses." },
                      { value: "later" as const, title: "Invite Later", sub: "Continue without sending invites." },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setInviteTiming(opt.value); setTouched((t) => ({ ...t, inviteTiming: true })); }}
                        className={[
                          "text-left rounded-2xl border p-5 transition",
                          inviteTiming === opt.value ? "border-indigo-600 bg-indigo-50 shadow-sm" : "border-gray-200 bg-white hover:border-indigo-200 hover:shadow-sm",
                        ].join(" ")}
                      >
                        <div className="text-sm font-semibold text-gray-900">{opt.title}</div>
                        <div className="mt-1 text-sm text-gray-500">{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                  {shouldShowError(touched.inviteTiming) && !inviteTiming && (
                    <FieldError>Please choose an option</FieldError>
                  )}

                  {inviteTiming === "now" && (
                    <div className="mt-6 space-y-4">
                      {coOwnerEmails.map((value, idx) => {
                        const trimmed = value.trim();
                        const show = shouldShowError(touched.coOwnerEmails[idx] ?? false);
                        const isInvalidError = show && !!trimmed && !isValidEmail(trimmed);
                        return (
                          <div key={idx}>
                            <FieldLabel>Co-owner email</FieldLabel>
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                value={value}
                                onChange={(e) => setCoOwnerEmails((prev) => prev.map((v, i) => i === idx ? e.target.value : v))}
                                onBlur={() => setTouched((t) => ({ ...t, coOwnerEmails: t.coOwnerEmails.map((v, i) => i === idx ? true : v) }))}
                                className={[
                                  "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
                                  isInvalidError ? "border-rose-300 focus:border-rose-400 focus:ring-rose-400/20" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20",
                                ].join(" ")}
                                placeholder="name@example.com"
                              />
                              {coOwnerEmails.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeCoOwnerEmail(idx)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            {isInvalidError && <FieldError>Enter a valid email</FieldError>}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={addCoOwnerEmail}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:bg-indigo-50 transition"
                      >
                        + Add another co-owner
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600">
                  No co-owners to invite. Continue to review and create your workspace.
                </div>
              )
            )}

            {/* STEP 4 */}
            {currentKey === 4 && (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-4">Review &amp; Create</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-xs font-semibold text-gray-500">Workspace</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">{name || "—"}</div>
                    <div className="mt-2 text-xs text-gray-600">Type: <span className="font-medium">{kindLabel}</span></div>
                    <div className="mt-1 text-xs text-gray-600">Industry: <span className="font-medium">{effectiveIndustry || "—"}</span></div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-xs font-semibold text-gray-500">Details</div>
                    <div className="mt-2 text-xs text-gray-600">Country: <span className="font-medium">{country || "—"}</span></div>
                    <div className="mt-1 text-xs text-gray-600">Employees: <span className="font-medium">{employees || "—"}</span></div>
                    <div className="mt-1 text-xs text-gray-600">Currency: <span className="font-medium">{currency || "—"}</span></div>
                  </div>
                  <div className="sm:col-span-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-xs font-semibold text-gray-500">Ownership</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {ownership === "sole" ? "Sole Owner" : ownership === "multiple" ? "Multiple Owners" : "—"}
                    </div>
                    {ownership === "multiple" && (
                      <div className="mt-2 text-xs text-gray-600">
                        Invites: <span className="font-medium">{inviteTiming === "now" ? "Sending now" : inviteTiming === "later" ? "Invite later" : "—"}</span>
                      </div>
                    )}
                    {inviteTiming === "now" && coOwnerEmails.filter(Boolean).length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        Emails: <span className="font-medium">{coOwnerEmails.filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                    {description.trim() && (
                      <div className="mt-3 text-xs text-gray-600">
                        <div className="font-semibold text-gray-500">Description</div>
                        <div className="mt-1 whitespace-pre-wrap">{description.trim()}</div>
                      </div>
                    )}
                  </div>
                </div>

                {submitError && (
                  <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
                    {submitError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={onCreate}
                  disabled={isSubmitting}
                  className={[
                    "mt-6 inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white transition",
                    isSubmitting ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700",
                  ].join(" ")}
                >
                  {isSubmitting ? "Creating Workspace..." : "Create Workspace"}
                </button>
              </div>
            )}
          </div>

          {/* Footer navigation */}
          <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-100 pt-6">
            {backHref ? (
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                <span aria-hidden>←</span> Back
              </Link>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                <span aria-hidden>←</span> Back
              </button>
            )}

            {currentKey !== 4 && (
              <button
                type="button"
                onClick={onNext}
                disabled={!canProceed}
                className={[
                  "inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition",
                  canProceed ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-indigo-200 text-white cursor-not-allowed",
                ].join(" ")}
              >
                Next <span aria-hidden>→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}