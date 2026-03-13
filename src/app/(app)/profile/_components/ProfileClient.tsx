"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  displayName: string;
  username: string;
  primaryEmail: string;
  alternateEmail: string | null;
  phoneNumber: string | null;
  workPhone: string | null;
  alternatePhone: string | null;
  profilePhoto: string | null;
  country: string | null;
  stateRegion: string | null;
  cityTown: string | null;
  streetAddress: string | null;
  postalCode: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelation: string | null;
};

type Props = { profile: Profile };

const RELATIONSHIP_OPTIONS = [
  "Parent",
  "Sibling",
  "Spouse",
  "Child",
  "Friend",
  "Colleague",
  "Relative",
  "Guardian",
  "Other",
];

function calcCompletion(p: Profile): number {
  const fields = [
    p.firstName,
    p.lastName,
    p.displayName,
    p.username,
    p.primaryEmail,
    p.profilePhoto,
    p.phoneNumber,
    p.alternateEmail,
    p.country,
    p.cityTown,
    p.streetAddress,
    p.emergencyName,
    p.emergencyPhone,
    p.emergencyRelation,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export default function ProfileClient({ profile }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Basic info
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [otherNames, setOtherNames] = useState(profile.otherNames ?? "");
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [profilePhoto, setProfilePhoto] = useState(profile.profilePhoto ?? "");
  const [photoPreview, setPhotoPreview] = useState(profile.profilePhoto ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Contact info
  const [alternateEmail, setAlternateEmail] = useState(profile.alternateEmail ?? "");
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber ?? "");
  const [workPhone, setWorkPhone] = useState(profile.workPhone ?? "");
  const [alternatePhone, setAlternatePhone] = useState(profile.alternatePhone ?? "");

  // Address
  const [country, setCountry] = useState(profile.country ?? "");
  const [stateRegion, setStateRegion] = useState(profile.stateRegion ?? "");
  const [cityTown, setCityTown] = useState(profile.cityTown ?? "");
  const [streetAddress, setStreetAddress] = useState(profile.streetAddress ?? "");
  const [postalCode, setPostalCode] = useState(profile.postalCode ?? "");

  // Emergency contact
  const [emergencyName, setEmergencyName] = useState(profile.emergencyName ?? "");
  const [emergencyRelation, setEmergencyRelation] = useState(profile.emergencyRelation ?? "");
  const [emergencyRelationOther, setEmergencyRelationOther] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState(profile.emergencyPhone ?? "");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const completion = calcCompletion({
    ...profile,
    firstName,
    lastName,
    displayName,
    username,
    profilePhoto: profilePhoto || null,
    alternateEmail: alternateEmail || null,
    phoneNumber: phoneNumber || null,
    country: country || null,
    cityTown: cityTown || null,
    streetAddress: streetAddress || null,
    emergencyName: emergencyName || null,
    emergencyPhone: emergencyPhone || null,
    emergencyRelation: emergencyRelation || null,
  });

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json() as { url?: string };
      if (data.url) setProfilePhoto(data.url);
    } catch {
      console.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function checkUsername(value: string) {
    if (!value.trim() || value === profile.username) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/profile/check-username?username=${encodeURIComponent(value)}`);
      const data = await res.json() as { available: boolean };
      setUsernameStatus(data.available ? "available" : "taken");
    } catch {
      setUsernameStatus("idle");
    }
  }

  async function handleSave() {
    if (usernameStatus === "taken" || usernameStatus === "checking") return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const finalEmergencyRelation =
      emergencyRelation === "Other" ? emergencyRelationOther : emergencyRelation;

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.userId,
          firstName,
          lastName,
          otherNames: otherNames || undefined,
          displayName,
          username,
          primaryEmail: profile.primaryEmail,
          profilePhoto: profilePhoto || undefined,
          alternateEmail: alternateEmail || undefined,
          phoneNumber: phoneNumber || undefined,
          workPhone: workPhone || undefined,
          alternatePhone: alternatePhone || undefined,
          country: country || undefined,
          stateRegion: stateRegion || undefined,
          cityTown: cityTown || undefined,
          streetAddress: streetAddress || undefined,
          postalCode: postalCode || undefined,
          emergencyName: emergencyName || undefined,
          emergencyPhone: emergencyPhone || undefined,
          emergencyRelation: finalEmergencyRelation || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to save");
      }

      setSaveSuccess(true);
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal information and contact details.
        </p>
      </div>

      {/* Profile Completion */}
      <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">Profile Completion</span>
          <span className="text-sm font-bold text-indigo-600">{completion}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!phoneNumber && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-full">
              + Add phone number
            </span>
          )}
          {!profilePhoto && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-full">
              + Add profile photo
            </span>
          )}
          {!country && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-full">
              + Add address
            </span>
          )}
          {!emergencyName && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-full">
              + Add emergency contact
            </span>
          )}
          {completion === 100 && (
            <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-1 rounded-full">
              ✓ Profile complete!
            </span>
          )}
        </div>
      </div>

      {/* Section 1 — Basic Info */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Basic Information</h2>

        {/* User ID — read only */}
        <div className="mb-5 rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-indigo-500 font-medium">MUNIX User ID</span>
          <span className="text-sm font-bold text-indigo-700 tracking-widest">{profile.userId}</span>
        </div>

        {/* Profile Photo */}
        <div className="flex items-center gap-5 mb-6">
          <div
            className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600 overflow-hidden cursor-pointer border-2 border-indigo-200 hover:border-indigo-400 transition flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            {photoPreview ? (
              <img src={photoPreview} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition"
            >
              {isUploading ? "Uploading..." : photoPreview ? "Change photo" : "Upload photo"}
            </button>
            <p className="text-xs text-gray-400 mt-1">JPG or PNG · Max 10MB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">First Name <span className="text-rose-500">*</span></label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Last Name <span className="text-rose-500">*</span></label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Other Names</label>
            <input value={otherNames} onChange={(e) => setOtherNames(e.target.value)}
              placeholder="Middle name or other names"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Display Name <span className="text-rose-500">*</span></label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-700 mb-1 block">Username <span className="text-rose-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
              <input
                value={username}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9._]/g, "");
                  setUsername(val);
                  void checkUsername(val);
                }}
                className={[
                  "w-full rounded-lg border px-3 py-2 pl-7 text-sm outline-none focus:ring-2",
                  usernameStatus === "taken"
                    ? "border-rose-300 focus:ring-rose-400/20"
                    : usernameStatus === "available"
                      ? "border-green-300 focus:ring-green-400/20"
                      : "border-gray-200 focus:ring-indigo-500/20",
                ].join(" ")}
              />
              {usernameStatus === "checking" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Checking...</span>}
              {usernameStatus === "available" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium">✓ Available</span>}
              {usernameStatus === "taken" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-rose-600 font-medium">✕ Taken</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 — Contact Info */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Contact Information</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-700 mb-1 block">Primary Email</label>
            <input
              value={profile.primaryEmail}
              disabled
              className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-400">Primary email cannot be changed here.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-700 mb-1 block">Alternate Email</label>
            <input value={alternateEmail} onChange={(e) => setAlternateEmail(e.target.value)}
              placeholder="backup@email.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Primary Phone</label>
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+256 700 000 000"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Work Phone</label>
            <input value={workPhone} onChange={(e) => setWorkPhone(e.target.value)}
              placeholder="+256 700 000 000"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Alternate Phone</label>
            <input value={alternatePhone} onChange={(e) => setAlternatePhone(e.target.value)}
              placeholder="+256 700 000 000"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
        </div>
      </div>

      {/* Section 3 — Address */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Address Information</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Country</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Uganda"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">State / Region</label>
            <input value={stateRegion} onChange={(e) => setStateRegion(e.target.value)}
              placeholder="e.g. Central Region"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">City / Town</label>
            <input value={cityTown} onChange={(e) => setCityTown(e.target.value)}
              placeholder="e.g. Kampala"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Postal Code</label>
            <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
              placeholder="e.g. 256"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-700 mb-1 block">Street Address</label>
            <input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="e.g. Makerere Hill Road"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
        </div>
      </div>

      {/* Section 4 — Emergency Contact */}
      <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Emergency Contact</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-700 mb-1 block">Contact Name</label>
            <input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Relationship</label>
            <select
              value={emergencyRelation}
              onChange={(e) => setEmergencyRelation(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Select relationship</option>
              {RELATIONSHIP_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {emergencyRelation === "Other" && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Specify Relationship</label>
              <input value={emergencyRelationOther} onChange={(e) => setEmergencyRelationOther(e.target.value)}
                placeholder="e.g. Mentor"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Contact Phone</label>
            <input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="+256 700 000 000"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
        </div>
      </div>

      {/* Save Button */}
      {saveError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600">
          ✓ Profile saved successfully!
        </div>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving || isUploading || usernameStatus === "taken" || usernameStatus === "checking"}
        className={[
          "w-full rounded-lg px-5 py-3 text-sm font-semibold text-white transition",
          isSaving || isUploading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700",
        ].join(" ")}
      >
        {isSaving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}