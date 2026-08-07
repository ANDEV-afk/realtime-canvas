import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Simple helper: Key ko presigned URL me convert karne ke liye
async function getImageUrl(image: string | null) {
  if (!image) return null;
  if (image.startsWith("http")) return image; // agar already full URL hai

  try {
    const cleanKey = image.startsWith("/") ? image.slice(1) : image;
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: cleanKey,
    });
    // 24 hours ke liye valid URL
    return await getSignedUrl(s3, command, { expiresIn: 86400 });
  } catch {
    return image;
  }
}

// POST Method (Save Version)
export async function POST(req: NextRequest,{ params }: { params: Promise<{ boardId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { boardId } = await params;
    const { snapshot } = await req.json();
    if (!snapshot) return NextResponse.json({ error: "Snapshot required" }, { status: 400 });

    const lastSnapshot = await prisma.boardSnapshot.findFirst({
      where: { boardId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const nextVersion = (lastSnapshot?.version ?? 0) + 1;

    const newVersion = await prisma.boardSnapshot.create({
      data: {
        boardId,
        snapshot,
        version: nextVersion,
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { name: true, image: true } },
      },
    });

    if (newVersion.createdBy?.image) {
      newVersion.createdBy.image = await getImageUrl(newVersion.createdBy.image);
    }

    return NextResponse.json(newVersion, { status: 201 });
  } catch (error) {
    console.error("Create version error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET Method (Fetch Versions with Browser Cache)
export async function GET(req: NextRequest,{ params }: { params: Promise<{ boardId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { boardId } = await params;

    const versions = await prisma.boardSnapshot.findMany({
      where: { boardId },
      orderBy: { version: "desc" },
      include: {
        createdBy: { select: { name: true, image: true } },
      },
    });

    // Har version image ko presigned URL me convert karein
    const formattedVersions = await Promise.all(
      versions.map(async (v) => {
        if (v.createdBy?.image) {
          v.createdBy.image = await getImageUrl(v.createdBy.image);
        }
        return v;
      })
    );

    // Cache-Control Header: Browser response ko 5 min cache karega (Instant Load)
    return NextResponse.json(formattedVersions, {headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("Fetch versions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}