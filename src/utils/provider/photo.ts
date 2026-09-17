"use client";

export type PhotoProblem = "type" | "size" | "read";

export class PhotoError extends Error {
  constructor(readonly reason: PhotoProblem) {
    super(reason);
    this.name = "PhotoError";
  }
}

const MAX_BYTES = 8 * 1024 * 1024;
const SIDE = 320;

export async function preparePhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new PhotoError("type");
  if (file.size > MAX_BYTES) throw new PhotoError("size");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new PhotoError("read");
  }

  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = SIDE;
    canvas.height = SIDE;

    const paper = canvas.getContext("2d");
    if (!paper) throw new PhotoError("read");

    paper.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      SIDE,
      SIDE,
    );

    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    bitmap.close();
  }
}
