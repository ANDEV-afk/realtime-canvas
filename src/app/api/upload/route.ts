import { auth } from "@/lib/auth";
import { s3 } from "@/lib/s3";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // 1. Secure the upload route
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 2. Reject video files
    if (
      file.type.startsWith("video/") ||
      /\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v|3gp)$/i.test(file.name)
    ) {
      return NextResponse.json(
        { error: "Video files are not allowed" },
        { status: 400 }
      );
    }

    const bucketName =
      process.env.AWS_BUCKET_NAME ||
      process.env.AWS_S3_BUCKET_NAME

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 3. Save strictly in canvas-media folder
    const fileName = `canvas-media/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );

    // 4. Generate a Presigned GET URL valid for 7 days for the canvas to render it
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    
    // 604800 = 7 days in seconds
    const presignedUrl = await getSignedUrl(s3, getCommand, { expiresIn: 604800 });

    // 5. Return exactly what lib/upload-asset.ts expects ({ url: ... })
    return NextResponse.json({ url: presignedUrl, key: fileName });
  } catch (error: any) {
    console.error("Canvas S3 Upload Error:", error);
    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 500 }
    );
  }
}