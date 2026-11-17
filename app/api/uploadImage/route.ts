import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "recipes",
    });

    return NextResponse.json({
      serverMsg: "Image uploaded!",
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ serverMsg: "Upload failed!" }, { status: 500 });
  }
}
