import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type WorkspaceOption = {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
};

const options: WorkspaceOption[] = [
  {
    href: "/create-workspace/business",
    icon: "🏢",
    title: "Business",
    subtitle: "For companies, agencies, and commercial businesses",
  },
  {
    href: "/create-workspace/organization",
    icon: "🏛️",
    title: "Organization",
    subtitle: "For NGOs, institutions, and associations",
  },
  {
    href: "/create-workspace/project",
    icon: "📁",
    title: "Project",
    subtitle: "For managing a specific project from start to finish",
  },
];

export default async function CreateWorkspaceSelectionPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-lg font-bold text-indigo-600 hover:text-indigo-700 transition"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
            MUNIX
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-indigo-200 hover:bg-indigo-50 transition"
          >
            <span aria-hidden>←</span>
            Back to Dashboard
          </Link>
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
            What would you like to manage?
          </h1>
          <p className="mt-3 text-base text-gray-500">
            Choose the type of workspace you want to create
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {options.map((opt) => (
            <Link
              key={opt.href}
              href={opt.href}
              className="group relative flex h-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
                <span aria-hidden>{opt.icon}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700 transition">
                    {opt.title}
                  </h2>
                  <span
                    className="text-gray-300 group-hover:text-indigo-400 transition"
                    aria-hidden
                  >
                    →
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  {opt.subtitle}
                </p>
              </div>

              {/* Selected state (CSS-only) for keyboard focus */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-0 ring-indigo-500/30 group-focus-visible:ring-4" />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

