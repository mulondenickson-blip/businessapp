"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";

function generateUserId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "USR-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Store User ID in sessionStorage so it never regenerates during the session
function getOrCreateUserId() {
  const stored = sessionStorage.getItem("munix_setup_user_id");
  if (stored) return stored;
  const newId = generateUserId();
  sessionStorage.setItem("munix_setup_user_id", newId);
  return newId;
}

export default function SetupProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state — all in one place, never reset by photo upload
  const [userId, setUserId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otherNames, setOtherNames] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [displayNameManuallyEdited, setDisplayNameManuallyEdited] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  // Generate User ID once — stored in sessionStorage so page refresh keeps same ID
  useEffect(() => {
    setUserId(getOrCreateUserId());
  }, []);

  // Pre-fill from Clerk — only runs once when user loads
  useEffect(() => {
    if (isLoaded && user) {
      const fn = user.firstName ?? "";
      const ln = user.lastName ?? "";
      setFirstName((prev) => prev || fn);
      setLastName((prev) => prev || ln);
      setDisplayName((prev) => prev || fn);
      setUsername((prev) => prev || `${fn.toLowerCase()}.${ln.toLowerCase()}`.replace(/\s+/g, "").replace(/[^a-z0-9._]/g, ""));
    }
  }, [isLoaded, user]);

  // Auto update display name from first name ONLY if user hasn't manually edited it
  useEffect(() => {
    if (!displayNameManuallyEdited && firstName) {
      setDisplayName(firstName);
    }
  }, [firstName, displayNameManuallyEdited]);

  // Username availability check with debounce
  const checkUsername = useCallback(async (value: string) => {
    if (!value.trim() || value.length < 3) {
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
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void checkUsername(username);
    }, 500);
    return () => clearTimeout(timeout);
  }, [username, checkUsername]);

  // Photo upload — completely isolated, does NOT touch any other state
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload in background without affecting other fields
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        setProfilePhoto(data.url);
      }
    } catch {
      console.error("Photo upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  const errors = {
    firstName: !firstName.trim(),
    lastName: !lastName.trim(),
    username: !username.trim() || usernameStatus === "taken",
    displayName: !displayName.trim(),
  };

  const canSubmit =
    !Object.values(errors).some(Boolean) &&
    usernameStatus !== "checking" &&
    !isUploading;

  async function handleSubmit() {
    setAttempted(true);
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          otherNames: otherNames.trim() || undefined,
          displayName: displayName.trim(),
          username: username.trim(),
          primaryEmail: user?.primaryEmailAddress?.emailAddress ?? "",
          profilePhoto: profilePhoto ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to save profile");
      }

      // Clear the session storage ID after successful save
      sessionStorage.removeItem("munix_setup_user_id");

      router.push("/dashboard");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Loading...</div>
      </main>
    );
  }

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-indigo-600 mb-2">MUNIX</div>
          <h1 className="text-2xl font-bold text-gray-900">Set Up Your Profile</h1>
          <p className="text-sm text-gray-500 mt-2">
            Tell us a bit about yourself before you get started.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

          {/* User ID — shown but never editable */}
          <div className="mb-6 rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-indigo-500 font-medium">Your MUNIX User ID</span>
            <span className="text-sm font-bold text-indigo-700 tracking-widest">
              {userId || "Generating..."}
            </span>
          </div>

          {/* Profile Photo — isolated upload section */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 mb-3 overflow-hidden cursor-pointer border-2 border-indigo-200 hover:border-indigo-400 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span>{initials || "?"}</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition"
            >
              {isUploading
                ? "Uploading..."
                : photoPreview
                  ? "Change photo"
                  : "Upload profile photo"}
            </button>
            <p className="text-xs text-gray-400 mt-1">Optional · JPG or PNG · Max 10MB</p>
          </div>

          <div className="space-y-5">

            {/* First Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-900">First Name</label>
                <span className="text-xs text-gray-400">Required</span>
              </div>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Your first name"
              />
              {attempted && errors.firstName && (
                <p className="mt-1 text-xs text-rose-600">This field is required</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-900">Last Name</label>
                <span className="text-xs text-gray-400">Required</span>
              </div>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Your last name"
              />
              {attempted && errors.lastName && (
                <p className="mt-1 text-xs text-rose-600">This field is required</p>
              )}
            </div>

            {/* Other Names */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-900">Other Names</label>
                <span className="text-xs text-gray-400">Optional</span>
              </div>
              <input
                value={otherNames}
                onChange={(e) => setOtherNames(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Middle name or other names"
              />
            </div>

            {/* Display Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-900">Display Name</label>
                <span className="text-xs text-gray-400">Required</span>
              </div>
              <input
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setDisplayNameManuallyEdited(true);
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Name shown in the app"
              />
              <p className="mt-1 text-xs text-gray-400">
                This is the name others will see in comments, tasks, and discussions.
              </p>
              {attempted && errors.displayName && (
                <p className="mt-1 text-xs text-rose-600">This field is required</p>
              )}
            </div>

            {/* Username */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-900">Username</label>
                <span className="text-xs text-gray-400">Required</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
                <input
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9._]/g, "")
                    )
                  }
                  className={[
                    "w-full rounded-lg border px-3 py-2 pl-7 text-sm outline-none focus:ring-2",
                    usernameStatus === "taken"
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-400/20"
                      : usernameStatus === "available"
                        ? "border-green-300 focus:border-green-400 focus:ring-green-400/20"
                        : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20",
                  ].join(" ")}
                  placeholder="your.username"
                />
                {usernameStatus === "checking" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    Checking...
                  </span>
                )}
                {usernameStatus === "available" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium">
                    ✓ Available
                  </span>
                )}
                {usernameStatus === "taken" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-rose-600 font-medium">
                    ✕ Taken
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Lowercase letters, numbers, dots and underscores only.
              </p>
              {attempted && !username.trim() && (
                <p className="mt-1 text-xs text-rose-600">This field is required</p>
              )}
            </div>

          </div>

          {submitError && (
            <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
              {submitError}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className={[
              "mt-8 w-full rounded-lg px-5 py-3 text-sm font-semibold text-white transition",
              isSubmitting || isUploading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700",
            ].join(" ")}
          >
            {isSubmitting ? "Saving..." : "Complete Setup →"}
          </button>

          <p className="mt-4 text-center text-xs text-gray-400">
            You can complete your full profile anytime from settings.
          </p>
        </div>
      </div>
    </main>
  );
}
