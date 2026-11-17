import imageCompression from "browser-image-compression";

const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const uploadImage = async (file: File) => {
  try {
    // 1. Tömörítés böngészőben (max 1MB, max 800px), így nem lépi túl a Vercel limitet
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    });

    // 2. Átalakítás base64 formátumba
    const base64 = await convertToBase64(compressed);

    // 3. Küldés a saját Next.js API végpontunkra (nincs külső domain!)
    const resp = await fetch("/api/uploadImage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 }),
    });

    if (!resp.ok) throw new Error("Képfeltöltési hiba");
    return await resp.json(); // { serverMsg, url, public_id }
  } catch (error) {
    console.error("Képfeltöltési hiba:", error);
    return null;
  }
};

export const deleteImage = async (public_id: string) => {
  try {
    const resp = await fetch("/api/deleteImage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id }),
    });

    if (!resp.ok) throw new Error("Képtörlési hiba");
    return await resp.json();
  } catch (error) {
    console.error("Képtörlési hiba:", error);
    return null;
  }
};

export const getAvatarUrl = (value: string | null) => {
  if (!value) return undefined;
  if (value.startsWith("http")) return value; // Régi ImgBB vagy teljes URL
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return cloudName
    ? `https://cloudinary.com{cloudName}/image/upload/${value}`
    : undefined;
};

export const uploadToImgBB = async (file: File): Promise<string | null> => {
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    });

    const formData = new FormData();
    formData.append("image", compressed);

    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    const resp = await fetch(`https://imgbb.com{apiKey}`, {
      method: "POST",
      body: formData,
    });

    const data = await resp.json();
    if (!resp.ok || !data.success) throw new Error("ImgBB feltöltési hiba");

    return data.data.url; // Visszaadja a kész képlinket
  } catch (error) {
    console.error("ImgBB képfeltöltési hiba:", error);
    return null;
  }
};
