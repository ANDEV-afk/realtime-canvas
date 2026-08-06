import { auth } from "@/lib/auth";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawKey = searchParams.get("key");

  if (!rawKey) {
    return NextResponse.json({ error: "Key is required" }, { status: 400 });
  }

  try {
    const key = decodeURIComponent(rawKey);
    const bucketName =
      process.env.AWS_BUCKET_NAME ||
      process.env.AWS_S3_BUCKET_NAME ||
      "infinite-canvas-demo";

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error("Presigned GET Error:", error);
    return NextResponse.json(
      { error: "Failed to generate signed download URL" },
      { status: 500 }
    );
  }
}