import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        forceRedirectUrl="/setup-profile"
        fallbackRedirectUrl="/setup-profile"
        signInForceRedirectUrl="/dashboard"
        signInFallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}
