const MAX_DIM = 1600;
const QUALITY = 0.85;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  if (width > MAX_DIM || height > MAX_DIM) {
    const r = Math.min(MAX_DIM / width, MAX_DIM / height);
    width = Math.round(width * r);
    height = Math.round(height * r);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', QUALITY));
  if (!blob) return file;
  const name = file.name.replace(/\.(png|webp|gif)$/i, '.jpg');
  return new File([blob], name, { type: 'image/jpeg' });
}

export function validateImageFile(file: File): string | null {
  const MAX_SIZE_MB = 20;
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!ALLOWED.includes(file.type)) return `${file.name}: unsupported file type. Use JPG, PNG, or WebP.`;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return `${file.name}: file too large (max ${MAX_SIZE_MB}MB).`;
  return null;
}
