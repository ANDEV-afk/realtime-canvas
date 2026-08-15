import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileHash = formData.get("fileHash") as string | null; //SHA-256 Hash extracted

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Reject video files strictly
    if (file.type.startsWith("video/") ||/\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v|3gp)$/i.test(file.name)) {
      return NextResponse.json(
        { error: "Video files are not allowed" },
        { status: 400 }
      );
    }

    // 🎯 DEDUPLICATION CHECK: Check if file hash already exists in DB
    if (fileHash) {
      const existingFile = await prisma.file.findFirst({
        where: { fileHash },
      });

      if (existingFile) {
        // Direct profile link existing key/url to user without uploading to S3
        await prisma.user.update({
          where: { id: session.user.id },
          data: { image: existingFile.key },
        });

        return NextResponse.json(
          { ...existingFile, key: existingFile.key, isDuplicate: true },
          { status: 200 }
        );
      }
    }

    const bucketName = process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME
    const region = process.env.AWS_REGION;

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `profiles/${session.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );

    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;

    // 1. Create file record
    const savedFile = await prisma.file.create({
      data: {
        url: publicUrl,
        key: fileName,
        fileHash: fileHash || null, //Saved hash in DB
        mimeType: file.type || "application/octet-stream",
        size: file.size || buffer.length,
        uploadedById: session.user.id,
      },
    });

    // 2. Link directly to logged-in user profile
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: fileName },
    });

    return NextResponse.json({ ...savedFile, key: fileName }, { status: 201 });
  } catch (error) {
    console.error("Upload File Error:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}