import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/create-workspace(.*)",
  "/workspace(.*)",
]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/setup-profile(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // If not logged in and trying to access protected route → sign in
  if (!userId && isProtectedRoute(req)) {
    await auth.protect();
    return;
  }

  // If logged in, check if profile is set up
  if (userId && !isPublicRoute(req)) {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { clerkId: userId },
      });

      // If no profile and not already on setup-profile → redirect there
      if (!profile && !req.nextUrl.pathname.startsWith("/setup-profile")) {
        return NextResponse.redirect(new URL("/setup-profile", req.url));
      }
    } catch {
      // If DB check fails, let them through
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
