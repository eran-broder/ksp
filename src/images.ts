import type { ProductImage } from "./schemas/product.js";

export const ImageSize = {
  /** ~100px thumbnail */
  Small: "s",
  /** ~550px medium */
  Medium: "b",
  /** ~550px+ large (highest available) */
  Large: "l",
} as const;

export type ImageSizeKey = (typeof ImageSize)[keyof typeof ImageSize];

export interface ProductImageUrl {
  index: number;
  imageId: string;
  url: string;
  width: number | null;
  height: number | null;
}

const FALLBACK_ORDER: ImageSizeKey[] = ["l", "b", "s"];

/**
 * Extract image URLs from a product's images array.
 * Falls back to the best available size if the requested one isn't present.
 */
export function extractImageUrls(images: ProductImage[], size: ImageSizeKey = "l"): ProductImageUrl[] {
  const priorities = [size, ...FALLBACK_ORDER.filter((s) => s !== size)];

  return images.flatMap((img, index) => {
    for (const s of priorities) {
      const sizeData = img.sizes[s];
      if (sizeData) {
        return [{
          index,
          imageId: img.img_id,
          url: sizeData.src,
          width: sizeData.metadata?.width ? Number(sizeData.metadata.width) : null,
          height: sizeData.metadata?.height ? Number(sizeData.metadata.height) : null,
        }];
      }
    }
    return [];
  });
}

/** Listing thumbnail URL from a product UIN (no API call needed). */
export function listingImageUrl(uin: number): string {
  return `https://ksp.co.il/shop/items/${uin}.jpg`;
}
