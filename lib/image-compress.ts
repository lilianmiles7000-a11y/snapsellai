/**
 * Client-side image compression before upload.
 * Resizes to max 1600px and re-encodes as JPEG quality 0.85.
 * Returns a new File, leaving the original untouched.
 */

const MAX_DIMENSION = 1600;
const QUALITY = 0.85;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/webp' && file.size < 800 * 1024) return file;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = width > height ? MAX_DIMENSION / width : MAX_DIMENSION / height;
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY)
  );
  if (!blob) return file;

  bitmap.close?.();
  const name = file.name.replace(/\.(png|webp|jpg|jpeg)$/i, '.jpg');
  return new File([blob], name, { type: 'image/jpeg' });
}
