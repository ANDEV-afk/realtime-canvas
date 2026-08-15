import prisma from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

async function getImageUrl(image: string | null) {
  if (!image) return null;
  if (image.startsWith("http") || image.startsWith("data:") || image.startsWith("blob:")) return image;

  try {
    const cleanKey = image.startsWith("/") ? image.slice(1) : image;
    const bucketName =
      process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME

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
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json([]);
    }

    const userIds = idsParam.split(",").filter((id) => !id.startsWith("guest_"));

    if (userIds.length === 0) {
      return NextResponse.json([]);
    }

    // Query Prisma for given user IDs
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    const usersWithSignedImages = await Promise.all(
      users.map(async (u) => ({
        ...u,
        image: await getImageUrl(u.image),
      }))
    );

    return NextResponse.json(usersWithSignedImages);
  } catch (error) {
    console.error("API Users Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
