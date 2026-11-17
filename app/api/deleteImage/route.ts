import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const { public_id } = await request.json();
    const deleteResult = await cloudinary.uploader.destroy(public_id);

    if (deleteResult.result === "ok") {
      return NextResponse.json({ serverMsg: "Image delete successful!" });
    }
    return NextResponse.json({ serverMsg: "Image not found!" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { serverMsg: "Failed to delete image!" },
      { status: 500 }
    );
  }
}
