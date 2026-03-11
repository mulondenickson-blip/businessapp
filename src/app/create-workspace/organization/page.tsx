import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BusinessOrgWorkspaceWizard } from "../_components/BusinessOrgWorkspaceWizard";

export default async function CreateOrganizationWorkspacePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <BusinessOrgWorkspaceWizard kind="organization" />;
}

