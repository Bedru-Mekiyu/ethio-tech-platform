import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const AVATARS_DIR = path.join(__dirname, "..", "..", "public", "avatars");

const SYSTEM_AVATARS = [
  "student-01.svg",
  "student-02.svg",
  "student-03.svg",
  "student-04.svg",
  "mentor-01.svg",
  "mentor-02.svg",
  "mentor-03.svg",
  "mentor-04.svg",
];

async function uploadAvatar(filename) {
  const filePath = path.join(AVATARS_DIR, filename);
  const avatarId = filename.replace(".svg", "");

  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "avatars/system",
      public_id: avatarId,
      resource_type: "image",
      overwrite: true,
      unique_filename: false,
      transformation: [
        { width: 512, height: 512, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    console.log(`✓ Uploaded ${avatarId}: ${result.secure_url}`);
    return { id: avatarId, url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    console.error(`✗ Failed to upload ${avatarId}:`, error.message);
    return null;
  }
}

async function main() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error(
      "Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
    );
    process.exit(1);
  }

  console.log("Uploading system avatars to Cloudinary...\n");

  const results = [];
  for (const avatar of SYSTEM_AVATARS) {
    const result = await uploadAvatar(avatar);
    if (result) results.push(result);
  }

  console.log(`\nUploaded ${results.length}/${SYSTEM_AVATARS.length} avatars`);

  if (results.length === SYSTEM_AVATARS.length) {
    console.log("\nAll system avatars uploaded successfully!");
    console.log("Add these to your .env or verify they're accessible:");
    results.forEach((r) => console.log(`  ${r.id}: ${r.url}`));
  }
}

main().catch(console.error);
