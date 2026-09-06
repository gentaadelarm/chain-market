import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const promotionsDir = path.join(process.cwd(), "public", "promotions");

  if (!fs.existsSync(promotionsDir)) {
    return NextResponse.json([]);
  }

  const allowedExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
  ];

  const files = fs
    .readdirSync(promotionsDir)
    .filter((file) =>
      allowedExtensions.includes(path.extname(file).toLowerCase())
    )
    .sort((a, b) => a.localeCompare(b));

  const promotions = files.map((file) => ({
    name: file,
    url: `/promotions/${encodeURIComponent(file)}`,
  }));

  return NextResponse.json(promotions);
}
