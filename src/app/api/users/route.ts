import prisma from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

async function getImageUrl(image: string | null) {
  if (!image) return "";
  if (image.startsWith("http") || image.startsWith("data:") || image.startsWith("blob:")) return image;

  try {
    const cleanKey = image.startsWith("/") ? image.slice(1) : image;
    const bucketName = process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
    });

    return await getSignedUrl(s3, command, { expiresIn: 86400 });
  } catch {
    return image;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // 👈 Accept both ?userIds=... and ?ids=...
    const idsParam = searchParams.get("userIds") || searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json([]);
    }

    const rawIds = idsParam.split(",").map((id) => id.trim()).filter(Boolean);

    if (rawIds.length === 0) {
      return NextResponse.json([]);
    }

    // Filter DB registered user IDs
    const registeredUserIds = rawIds.filter((id) => !id.startsWith("guest_"));

    // Query Prisma for registered users
    const dbUsers = registeredUserIds.length > 0 ? await prisma.user.findMany({
          where: {
            id: { in: registeredUserIds },
          },
          select: {
            id: true,
            name: true,
            image: true,
          },
        })
      : [];

    // Pre-resolve signed URLs and store in a map
    const resolvedUsersMap = new Map<string, { name: string; avatar: string }>();

    await Promise.all(
      dbUsers.map(async (u) => {
        const avatarUrl = await getImageUrl(u.image);
        resolvedUsersMap.set(u.id, {
          name: u.name || "User",
          avatar: avatarUrl || "",
        });
      })
    );

    // Map over EVERY requested ID so Liveblocks receives an entry for all IDs (including guests)
    const finalUsers = rawIds.map((id) => {
      if (id.startsWith("guest_")) {
        return {id,name: "Guest User",avatar: ""};
      }

      const foundUser = resolvedUsersMap.get(id);
      if (foundUser) {
        return {
          id,
          name: foundUser.name,
          avatar: foundUser.avatar,
        };
      }

      return {id,name: "Unknown User",avatar: ""};
    });

    return NextResponse.json(finalUsers);
  } catch (error) {
    console.error("API Users Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}