"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BusinessDetails = {
  id: string;
  workspaceId: string;
  logo: string | null;
  registrationNumber: string | null;
  legalStructure: string | null;
  yearFounded: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  websiteUrl: string | null;
  physicalAddress: string | null;
  mission: string | null;
  vision: string | null;
  coreValues: string | null;
  operatingHours: string | null;
  linkedin: string | null;
  twitter: string | null;
  facebook: string | null;
  instagram: string | null;
  otherSocial: string | null;
} | null;

type PendingChange = {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string;
  submittedBy: string;
  status: string;
  createdAt: Date;
};

type Props = {
  workspace: {
    id: string;
    name: string;
    type: string;
    industry: string | null;
    country: string | null;
    employees: string | null;
    currency: string | null;
    description: string | null;
  };
  businessDetails: BusinessDetails;
  isOwner: boolean;
  canEdit: boolean;
  pendingChangesCount: number;
  pendingChanges: PendingChange[];
  currentUserId: string;
};

const LEGAL_STRUCTURES = [
  "Sole Proprietorship",
  "Partnership",
  "Limited Liability Company (LLC)",
  "Corporation",
  "Non-Profit",
  "Cooperative",
  "Other",
];

const FIELD_LABELS: Record<string, string> = {
  registrationNumber: "Registration Number",
  legalStructure: "Legal Structure",
  yearFounded: "Year Founded",
  businessEmail: "Business Email",
  businessPhone: "Business Phone",
  websiteUrl: "Website URL",
  physicalAddress: "Physical Address",
  mission: "Mission Statement",
  vision: "Vision Statement",
  coreValues: "Core Values",
  operatingHours: "Operating Hours",
  linkedin: "LinkedIn",
  twitter: "Twitter/X",
  facebook: "Facebook",
  instagram: "Instagram",
  otherSocial: "Other Social Media",
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className={[
        "text-sm font-medium",
        value ? "text-gray-900" : "text-gray-300 italic",
      ].join(" ")}>
        {value || "NOT SET"}
      </div>
    </div>
  );
}

export default function BusinessDetailsClient({
  workspace,
  businessDetails,
  isOwner,
  canEdit,
  pendingChangesCount,
  pendingChanges,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPendingReview, setShowPendingReview] = useState(false);

  // Form state
  const [registrationNumber, setRegistrationNumber] = useState(businessDetails?.registrationNumber ?? "");
  const [legalStructure, setLegalStructure] = useState(businessDetails?.legalStructure ?? "");
  const [yearFounded, setYearFounded] = useState(businessDetails?.yearFounded ?? "");
  const [businessEmail, setBusinessEmail] = useState(businessDetails?.businessEmail ?? "");
  const [businessPhone, setBusinessPhone] = useState(businessDetails?.businessPhone ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(businessDetails?.websiteUrl ?? "");
  const [physicalAddress, setPhysicalAddress] = useState(businessDetails?.physicalAddress ?? "");
  const [mission, setMission] = useState(businessDetails?.mission ?? "");
  const [vision, setVision] = useState(businessDetails?.vision ?? "");
  const [coreValues, setCoreValues] = useState(businessDetails?.coreValues ?? "");
  const [operatingHours, setOperatingHours] = useState(businessDetails?.operatingHours ?? "");
  const [linkedin, setLinkedin] = useState(businessDetails?.linkedin ?? "");
  const [twitter, setTwitter] = useState(businessDetails?.twitter ?? "");
  const [facebook, setFacebook] = useState(businessDetails?.facebook ?? "");
  const [instagram, setInstagram] = useState(businessDetails?.instagram ?? "");
  const [otherSocial, setOtherSocial] = useState(businessDetails?.otherSocial ?? "");

  function getChangedFields() {
    const changes: { fieldName: string; oldValue: string | null; newValue: string }[] = [];
    const fields = [
      { name: "registrationNumber", current: registrationNumber, original: businessDetails?.registrationNumber ?? "" },
      { name: "legalStructure", current: legalStructure, original: businessDetails?.legalStructure ?? "" },
      { name: "yearFounded", current: yearFounded, original: businessDetails?.yearFounded ?? "" },
      { name: "businessEmail", current: businessEmail, original: businessDetails?.businessEmail ?? "" },
      { name: "businessPhone", current: businessPhone, original: businessDetails?.businessPhone ?? "" },
      { name: "websiteUrl", current: websiteUrl, original: businessDetails?.websiteUrl ?? "" },
      { name: "physicalAddress", current: physicalAddress, original: businessDetails?.physicalAddress ?? "" },
      { name: "mission", current: mission, original: businessDetails?.mission ?? "" },
      { name: "vision", current: vision, original: businessDetails?.vision ?? "" },
      { name: "coreValues", current: coreValues, original: businessDetails?.coreValues ?? "" },
      { name: "operatingHours", current: operatingHours, original: businessDetails?.operatingHours ?? "" },
      { name: "linkedin", current: linkedin, original: businessDetails?.linkedin ?? "" },
      { name: "twitter", current: twitter, original: businessDetails?.twitter ?? "" },
      { name: "facebook", current: facebook, original: businessDetails?.facebook ?? "" },
      { name: "instagram", current: instagram, original: businessDetails?.instagram ?? "" },
      { name: "otherSocial", current: otherSocial, original: businessDetails?.otherSocial ?? "" },
    ];

    fields.forEach((f) => {
      if (f.current !== f.original) {
        changes.push({
          fieldName: f.name,
          oldValue: f.original || null,
          newValue: f.current,
        });
      }
    });

    return changes;
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);

    const changedFields = getChangedFields();

    if (isOwner) {
      // Owner saves directly
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registrationNumber, legalStructure, yearFounded,
            businessEmail, businessPhone, websiteUrl, physicalAddress,
            mission, vision, coreValues, operatingHours,
            linkedin, twitter, facebook, instagram, otherSocial,
          }),
        });
        if (!res.ok) throw new Error("Failed to save");
        setIsEditing(false);
        router.refresh();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Something went wrong");
      }
    } else {
      // Non-owner submits changes for review
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/pending-changes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ changes: changedFields }),
        });
        if (!res.ok) throw new Error("Failed to submit changes");
        setIsEditing(false);
        setShowPendingReview(true);
        router.refresh();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Something went wrong");
      }
    }

    setIsSaving(false);
  }

  async function handleRequestEdit() {
    if (!requestReason.trim()) return;
    setIsSubmittingRequest(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/edit-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: requestReason }),
      });
      if (!res.ok) throw new Error("Failed to submit request");
      setRequestSuccess(true);
      setShowRequestForm(false);
      setRequestReason("");
    } catch {
      console.error("Failed to submit edit request");
    } finally {
      setIsSubmittingRequest(false);
    }
  }

  async function handleApproveChange(changeId: string) {
    try {
      await fetch(`/api/workspaces/${workspace.id}/pending-changes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeId, action: "approve" }),
      });
      router.refresh();
    } catch {
      console.error("Failed to approve change");
    }
  }

  async function handleRejectChange(changeId: string) {
    try {
      await fetch(`/api/workspaces/${workspace.id}/pending-changes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeId, action: "reject" }),
      });
      router.refresh();
    } catch {
      console.error("Failed to reject change");
    }
  }

  async function handleApproveEditRequest(requestId: string) {
    try {
      await fetch(`/api/workspaces/${workspace.id}/edit-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "approve" }),
      });
      router.refresh();
    } catch {
      console.error("Failed to approve edit request");
    }
  }

  function handleCancel() {
    setRegistrationNumber(businessDetails?.registrationNumber ?? "");
    setLegalStructure(businessDetails?.legalStructure ?? "");
    setYearFounded(businessDetails?.yearFounded ?? "");
    setBusinessEmail(businessDetails?.businessEmail ?? "");
    setBusinessPhone(businessDetails?.businessPhone ?? "");
    setWebsiteUrl(businessDetails?.websiteUrl ?? "");
    setPhysicalAddress(businessDetails?.physicalAddress ?? "");
    setMission(businessDetails?.mission ?? "");
    setVision(businessDetails?.vision ?? "");
    setCoreValues(businessDetails?.coreValues ?? "");
    setOperatingHours(businessDetails?.operatingHours ?? "");
    setLinkedin(businessDetails?.linkedin ?? "");
    setTwitter(businessDetails?.twitter ?? "");
    setFacebook(businessDetails?.facebook ?? "");
    setInstagram(businessDetails?.instagram ?? "");
    setOtherSocial(businessDetails?.otherSocial ?? "");
    setSaveError(null);
    setIsEditing(false);
  }

  const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
  const textareaClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none";

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            {workspace.name} · Official business information
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              ✏️ Edit Details
            </button>
          )}
          {!isEditing && !canEdit && !isOwner && !requestSuccess && (
            <button
              onClick={() => setShowRequestForm(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition"
            >
              Request Edit Access
            </button>
          )}
        </div>
      </div>

      {/* Request Success */}
      {requestSuccess && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 font-medium">
          ✓ Edit request submitted. You will be notified once the owner responds.
        </div>
      )}

      {/* Pending Review Notice */}
      {showPendingReview && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="text-sm font-semibold text-amber-800">Changes Submitted for Review</div>
          <div className="text-xs text-amber-600 mt-0.5">
            Your changes are pending approval from the workspace owner before they go live.
          </div>
        </div>
      )}

      {/* Request Edit Form */}
      {showRequestForm && (
        <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
          <h3 className="text-sm font-semibold text-indigo-900 mb-3">Request Edit Access</h3>
          <textarea
            value={requestReason}
            onChange={(e) => setRequestReason(e.target.value)}
            placeholder="Explain why you need to edit this information..."
            rows={3}
            className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white resize-none"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => void handleRequestEdit()}
              disabled={isSubmittingRequest || !requestReason.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {isSubmittingRequest ? "Submitting..." : "Submit Request"}
            </button>
            <button
              onClick={() => setShowRequestForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pending Changes Review — Owner Only */}
      {isOwner && pendingChangesCount > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold text-amber-900 mb-4">
            ⏳ {pendingChangesCount} Change{pendingChangesCount > 1 ? "s" : ""} Awaiting Your Approval
          </h3>
          <div className="space-y-3">
            {pendingChanges.map((change) => (
              <div key={change.id} className="bg-white rounded-xl border border-amber-100 p-4">
                <div className="text-xs font-semibold text-gray-700 mb-2">
                  {FIELD_LABELS[change.fieldName] ?? change.fieldName}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Current Value</div>
                    <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                      {change.oldValue ?? "NOT SET"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Proposed Change</div>
                    <div className="text-xs text-indigo-700 bg-indigo-50 rounded-lg p-2 font-medium">
                      {change.newValue}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void handleApproveChange(change.id)}
                    className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => void handleRejectChange(change.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE */}
      {!isEditing && (
        <div className="space-y-6">

          {/* Identity */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Identity</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Business Name" value={workspace.name} />
              <Field label="Industry" value={workspace.industry} />
              <Field label="Registration Number" value={businessDetails?.registrationNumber} />
              <Field label="Legal Structure" value={businessDetails?.legalStructure} />
              <Field label="Year Founded" value={businessDetails?.yearFounded} />
              <Field label="Number of Employees" value={workspace.employees} />
            </div>
          </div>

          {/* Contact & Location */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Contact & Location</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Business Email" value={businessDetails?.businessEmail} />
              <Field label="Business Phone" value={businessDetails?.businessPhone} />
              <Field label="Website" value={businessDetails?.websiteUrl} />
              <Field label="Country" value={workspace.country} />
              <div className="sm:col-span-2">
                <Field label="Physical Address" value={businessDetails?.physicalAddress} />
              </div>
            </div>
          </div>

          {/* About */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">About</h2>
            <div className="space-y-4">
              <Field label="Description" value={workspace.description} />
              <Field label="Mission Statement" value={businessDetails?.mission} />
              <Field label="Vision Statement" value={businessDetails?.vision} />
              <Field label="Core Values" value={businessDetails?.coreValues} />
            </div>
          </div>

          {/* Operations */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Operations</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Operating Hours" value={businessDetails?.operatingHours} />
              <Field label="Currency" value={workspace.currency} />
            </div>
          </div>

          {/* Social Media */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Social Media</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="LinkedIn" value={businessDetails?.linkedin} />
              <Field label="Twitter/X" value={businessDetails?.twitter} />
              <Field label="Facebook" value={businessDetails?.facebook} />
              <Field label="Instagram" value={businessDetails?.instagram} />
              <Field label="Other" value={businessDetails?.otherSocial} />
            </div>
          </div>

        </div>
      )}

      {/* EDIT MODE */}
      {isEditing && (
        <div className="space-y-6">

          {/* Identity */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Identity</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Business Name</label>
                <input value={workspace.name} disabled className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Change name in workspace settings.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Industry</label>
                <input value={workspace.industry ?? ""} disabled className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Registration Number</label>
                <input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} className={inputClass} placeholder="e.g. REG-123456" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Legal Structure</label>
                <select value={legalStructure} onChange={(e) => setLegalStructure(e.target.value)} className={inputClass}>
                  <option value="">Select structure</option>
                  {LEGAL_STRUCTURES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Year Founded</label>
                <input value={yearFounded} onChange={(e) => setYearFounded(e.target.value)} className={inputClass} placeholder="e.g. 2020" />
              </div>
            </div>
          </div>

          {/* Contact & Location */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Contact & Location</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Business Email</label>
                <input value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className={inputClass} placeholder="business@email.com" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Business Phone</label>
                <input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className={inputClass} placeholder="+256 700 000 000" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Website URL</label>
                <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={inputClass} placeholder="https://yourwebsite.com" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-700 mb-1 block">Physical Address</label>
                <input value={physicalAddress} onChange={(e) => setPhysicalAddress(e.target.value)} className={inputClass} placeholder="Street, City, Country" />
              </div>
            </div>
          </div>

          {/* About */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">About</h2>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Mission Statement</label>
                <textarea value={mission} onChange={(e) => setMission(e.target.value)} rows={3} className={textareaClass} placeholder="What is your business mission?" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Vision Statement</label>
                <textarea value={vision} onChange={(e) => setVision(e.target.value)} rows={3} className={textareaClass} placeholder="What is your business vision?" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Core Values</label>
                <textarea value={coreValues} onChange={(e) => setCoreValues(e.target.value)} rows={3} className={textareaClass} placeholder="e.g. Integrity, Innovation, Excellence" />
              </div>
            </div>
          </div>

          {/* Operations */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Operations</h2>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Operating Hours</label>
              <input value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} className={inputClass} placeholder="e.g. Mon-Fri 8am-5pm" />
            </div>
          </div>

          {/* Social Media */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Social Media</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">LinkedIn</label>
                <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={inputClass} placeholder="https://linkedin.com/company/..." />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Twitter/X</label>
                <input value={twitter} onChange={(e) => setTwitter(e.target.value)} className={inputClass} placeholder="https://twitter.com/..." />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Facebook</label>
                <input value={facebook} onChange={(e) => setFacebook(e.target.value)} className={inputClass} placeholder="https://facebook.com/..." />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Instagram</label>
                <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className={inputClass} placeholder="https://instagram.com/..." />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-700 mb-1 block">Other Social Media</label>
                <input value={otherSocial} onChange={(e) => setOtherSocial(e.target.value)} className={inputClass} placeholder="Any other social media link" />
              </div>
            </div>
          </div>

          {/* Save / Cancel */}
          {saveError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
              {saveError}
            </div>
          )}

          {!isOwner && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
              ⚠️ Since you are not the owner, your changes will be submitted for review before going live.
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className={[
                "flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-white transition",
                isSaving ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700",
              ].join(" ")}
            >
              {isSaving
                ? "Saving..."
                : isOwner
                ? "Save Changes"
                : "Submit for Review"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}