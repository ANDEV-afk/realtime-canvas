import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    // 1. Find Workspace by Invite Code
    const workspace = await prisma.workspace.findFirst({
      where: {
        OR: [
          { inviteCode: inviteCode },
          { id: inviteCode }
        ]
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or invalid link" },
        { status: 404 }
      );
    }

    // 2. Check if User is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: session.user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({
        message: "You are already a member of this workspace",
        workspace,
      });
    }

    // 3. Add User to Workspace as EDITOR (Default Role)
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: session.user.id,
        role: "EDITOR", // Default role assigned to invited members
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined the workspace!",
      workspace,
    });
  } catch (error) {
    console.error("JOIN_WORKSPACE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest,{ params }: { params: Promise<{ inviteCode: string }> }) {
  try {
    const { inviteCode } = await params; // 2. params ko await karo!

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code missing" },
        { status: 400 }
      );
    }

    // Workspace search logic (both ID & inviteCode)
    const workspace = await prisma.workspace.findFirst({
      where: {
        OR: [
          { inviteCode: inviteCode },
          { id: inviteCode }
        ]
      },
      select: {
        id: true,
        name: true,
        inviteCode: true,
      }
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or link expired" },
        { status: 404 }
      );
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("GET_INVITE_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}