import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProjectCreateForm } from "../_components/ProjectCreateForm";

export default async function CreateProjectWorkspacePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <ProjectCreateForm />;
}

