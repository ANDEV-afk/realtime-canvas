// lib/upload-asset.ts
import { TLAssetStore } from "tldraw";
import { toast } from "sonner";

export const customAssetStore: TLAssetStore = {
  async upload(_asset, file) {
    if (!file) {
      throw new Error("No file provided");
    }

    // Block video uploads with a clear toast notification
    if (
      file.type.startsWith("video/") ||
      /\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v|3gp)$/i.test(file.name)
    ) {
      toast.error("Video uploads are not supported. Please upload images only.");
      throw new Error("Video uploads are not supported.");
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error("Invalid upload response: missing url");
      }

      return { src: data.url };
    } catch (error) {
      console.error("Canvas asset upload error:", error);
      toast.error("Failed to upload file to S3");
      throw error;
    }
  },
  resolve(asset) {
    if (asset.type === "bookmark") {
      return (asset.props as unknown as { url?: string }).url || "";
    }
    const props = asset.props as unknown as { src?: string; url?: string };
    return props.src || props.url || "";
  },
};
