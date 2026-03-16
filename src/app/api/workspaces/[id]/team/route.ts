import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../../../generated/prisma";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// POST — invite a member
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { members: true, delegates: true },
    });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    const member = workspace.members.find((m) => m.userId === userId);
    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });
    if (member.role === "viewer") return NextResponse.json({ error: "Viewers cannot invite" }, { status: 403 });

    const body = await request.json() as {
      email: string;
      role: string;
      departmentId?: string;
      personalMessage?: string;
    };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: id,
        email: body.email,
        role: body.role,
        departmentId: body.departmentId,
        invitedBy: userId,
        personalMessage: body.personalMessage,
        expiresAt,
      },
    });

    // Get inviter profile
    const inviterProfile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });

    // Build invite URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://businessapp-orcin.vercel.app";
    const inviteUrl = `${appUrl}/invite/${invite.token}`;

    // Send invite email
    await resend.emails.send({
      from: "MUNIX <onboarding@resend.dev>",
      to: body.email,
      subject: `You've been invited to join ${workspace.name} on MUNIX`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
            <div style="max-width: 560px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
              
              <!-- Header -->
              <div style="background: #4f46e5; padding: 32px; text-align: center;">
                <h1 style="color: white; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">MUNIX</h1>
                <p style="color: #c7d2fe; font-size: 14px; margin: 8px 0 0 0;">Business & Project Management</p>
              </div>

              <!-- Content -->
              <div style="padding: 32px;">
                <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">
                  You have been invited! 🎉
                </h2>
                <p style="font-size: 15px; color: #6b7280; margin: 0 0 24px 0;">
                  <strong style="color: #111827;">${inviterProfile?.displayName ?? "Someone"}</strong> 
                  has invited you to join 
                  <strong style="color: #111827;">${workspace.name}</strong> 
                  as a <strong style="color: #4f46e5; text-transform: capitalize;">${body.role}</strong>.
                </p>

                ${body.personalMessage ? `
                <!-- Personal Message -->
                <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #4f46e5;">
                  <p style="font-size: 13px; color: #6b7280; margin: 0 0 4px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Personal Message</p>
                  <p style="font-size: 14px; color: #374151; margin: 0; font-style: italic;">"${body.personalMessage}"</p>
                </div>
                ` : ""}

                <!-- Workspace Info -->
                <div style="background: #eef2ff; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                  <p style="font-size: 13px; color: #6b7280; margin: 0 0 4px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Workspace</p>
                  <p style="font-size: 16px; font-weight: 700; color: #4f46e5; margin: 0;">${workspace.name}</p>
                  <p style="font-size: 13px; color: #6b7280; margin: 4px 0 0 0; text-transform: capitalize;">${workspace.type}${workspace.industry ? ` · ${workspace.industry}` : ""}${workspace.country ? ` · ${workspace.country}` : ""}</p>
                </div>

                <!-- CTA Button -->
                <a href="${inviteUrl}" 
                   style="display: block; background: #4f46e5; color: white; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; margin-bottom: 16px;">
                  Accept Invitation →
                </a>

                <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 0;">
                  This invitation expires on ${expiresAt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
                </p>
                <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 8px 0 0 0;">
                  If you did not expect this invitation you can safely ignore this email.
                </p>
              </div>

              <!-- Footer -->
              <div style="background: #f9fafb; padding: 20px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                  © ${new Date().getFullYear()} MUNIX. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    // Log activity
    if (inviterProfile) {
      await prisma.activity.create({
        data: {
          userId: inviterProfile.userId,
          workspaceId: id,
          type: "invite_sent",
          title: `Invited ${body.email} to join`,
          description: `You invited ${body.email} as ${body.role} to "${workspace.name}"`,
          actionUrl: `/workspace/${id}/team`,
        },
      });
    }

    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}

// PATCH — approve or reject a member
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { delegates: true },
    });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    const isOwner = workspace.ownerId === userId;
    const isDelegate = workspace.delegates.some(
      (d) => d.delegateUserId === userId && d.isActive && d.canApproveMembers
    );

    if (!isOwner && !isDelegate) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json() as {
      memberId: string;
      action: "approve" | "reject";
    };

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: body.memberId },
      data: {
        approvalStatus: body.action === "approve" ? "approved" : "rejected",
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    // Notify the member
    const memberProfile = await prisma.userProfile.findFirst({
      where: { clerkId: updatedMember.userId },
    });

    if (memberProfile) {
      await prisma.notification.create({
        data: {
          userId: memberProfile.userId,
          type: "member_joined",
          title: body.action === "approve"
            ? "Workspace Access Approved"
            : "Workspace Access Rejected",
          description: body.action === "approve"
            ? `Your membership in "${workspace.name}" has been approved.`
            : `Your membership in "${workspace.name}" was not approved.`,
          actionUrl: `/workspace/${id}`,
          actionLabel: "Open Workspace",
        },
      });

      // Send email notification to member
      await resend.emails.send({
        from: "MUNIX <onboarding@resend.dev>",
        to: memberProfile.primaryEmail,
        subject: body.action === "approve"
          ? `Your membership in ${workspace.name} has been approved`
          : `Your membership in ${workspace.name} was not approved`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
            <div style="background: #4f46e5; padding: 32px; text-align: center;">
              <h1 style="color: white; font-size: 24px; font-weight: 800; margin: 0;">MUNIX</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
                ${body.action === "approve" ? "Membership Approved ✓" : "Membership Not Approved"}
              </h2>
              <p style="font-size: 15px; color: #6b7280; margin: 0 0 24px 0;">
                ${body.action === "approve"
                  ? `Your membership in <strong>${workspace.name}</strong> has been approved. You can now access the workspace.`
                  : `Your membership request for <strong>${workspace.name}</strong> was not approved.`
                }
              </p>
              ${body.action === "approve" ? `
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://businessapp-orcin.vercel.app"}/workspace/${id}"
                 style="display: block; background: #4f46e5; color: white; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 12px; font-size: 15px; font-weight: 600;">
                Open Workspace →
              </a>
              ` : ""}
            </div>
          </div>
        `,
      });

      // Log activity
      const approverProfile = await prisma.userProfile.findUnique({
        where: { clerkId: userId },
      });
      if (approverProfile) {
        await prisma.activity.create({
          data: {
            userId: approverProfile.userId,
            workspaceId: id,
            type: body.action === "approve" ? "member_joined" : "member_left",
            title: body.action === "approve"
              ? `Approved ${memberProfile.displayName} as member`
              : `Rejected ${memberProfile.displayName}'s membership`,
            actionUrl: `/workspace/${id}/team`,
          },
        });
      }
    }

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

// DELETE — remove a member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    if (workspace.ownerId !== userId) {
      return NextResponse.json({ error: "Only owner can remove members" }, { status: 403 });
    }

    const body = await request.json() as { memberId: string };

    await prisma.workspaceMember.delete({
      where: { id: body.memberId },
    });

    // Log activity
    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
    });
    if (profile) {
      await prisma.activity.create({
        data: {
          userId: profile.userId,
          workspaceId: id,
          type: "member_left",
          title: "Removed a member from workspace",
          actionUrl: `/workspace/${id}/team`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}