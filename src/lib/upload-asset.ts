// lib/upload-asset.ts
import { TLAssetStore } from "tldraw";

export const customAssetStore: TLAssetStore = {
  async upload(asset, file) {
    if (!file) {
      throw new Error("No file provided");
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) return data.url;
      }
    } catch (error) {
      console.warn("S3 upload failed, falling back to base64 data URL:", error);
    }
  },
  resolve(asset) {
    return asset.props.src || "";
  },
};
