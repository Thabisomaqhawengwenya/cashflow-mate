import { Platform } from 'react-native';

/**
 * Resizes and compresses an image for profile avatar storage.
 * On Web: uses an HTML5 Canvas to downsample to max 320x320 at 0.82 quality JPEG.
 * Produces a ~20KB-30KB base64 string that permanently fits inside localStorage without quota errors.
 */
export async function compressAvatarForStorage(
  asset: { uri: string; file?: any }
): Promise<string> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const file = asset.file;
    if (file && file instanceof Blob) {
      return compressBlobWithCanvas(file, 320, 320, 0.82);
    }

    // If only asset.uri is present on web (e.g. data URI or blob URI)
    if (asset.uri) {
      return compressUriWithCanvas(asset.uri, 320, 320, 0.82);
    }
  }

  // On Native (iOS/Android), asset.uri is already a lightweight local cache file path
  return asset.uri;
}

function compressBlobWithCanvas(
  blob: Blob,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const src = e.target?.result as string;
      compressUriWithCanvas(src, maxWidth, maxHeight, quality)
        .then(resolve)
        .catch(reject);
    };
    reader.readAsDataURL(blob);
  });
}

function compressUriWithCanvas(
  dataUri: string,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(dataUri);
      return;
    }

    const img = new (window as any).Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUri);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch {
        resolve(dataUri);
      }
    };

    img.onerror = () => {
      resolve(dataUri);
    };

    img.src = dataUri;
  });
}
