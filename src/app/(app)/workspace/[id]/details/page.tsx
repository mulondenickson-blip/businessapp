import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "../../../../../../generated/prisma";
import { redirect, notFound } from "next/navigation";
import BusinessDetailsClient from "./_components/BusinessDetailsClient";

const prisma = new PrismaClient();

export default async function BusinessDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: { members: true, businessDetails: true },
  });

  if (!workspace) notFound();

  const member = workspace.members.find((m) => m.userId === userId);
  if (!member) redirect("/workspaces");

  const isOwner =
    workspace.ownerId === userId ||
    member.role === "co-owner" ||
    member.role === "owner";

  // Check if user has an approved edit request
  const approvedEditRequest = await prisma.editRequest.findFirst({
    where: {
      workspaceId: id,
      requesterId: userId,
      status: "approved",
    },
  });

  const canEdit = isOwner || !!approvedEditRequest;

  // Get pending changes count for owner review
  const pendingChangesCount = isOwner
    ? await prisma.pendingChange.count({
        where: { workspaceId: id, status: "pending" },
      })
    : 0;

  // Get pending changes for owner to review
  const pendingChanges = isOwner
    ? await prisma.pendingChange.findMany({
        where: { workspaceId: id, status: "pending" },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <BusinessDetailsClient
      workspace={{
        id: workspace.id,
        name: workspace.name,
        type: workspace.type,
        industry: workspace.industry,
        country: workspace.country,
        employees: workspace.employees,
        currency: workspace.currency,
        description: workspace.description,
      }}
      businessDetails={workspace.businessDetails}
      isOwner={isOwner}
      canEdit={canEdit}
      pendingChangesCount={pendingChangesCount}
      pendingChanges={pendingChanges}
      currentUserId={userId}
    />
  );
}