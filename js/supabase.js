import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://etjeyblrvfvnftwgrtgl.supabase.co';
export const supabaseKey = 'sb_publishable_iozyPFSZqfkITZ5M9Aa70A_rIqVJJvr';

export const supabase = createClient(supabaseUrl, supabaseKey);

export function normalizeProductImages(product) {
  const images = Array.isArray(product?.product_images) ? [...product.product_images] : [];

  return images
    .filter((image) => Boolean(image?.image_url))
    .sort((a, b) => {
      if (a?.is_primary !== b?.is_primary) {
        return a?.is_primary ? -1 : 1;
      }

      const aSort = Number.isFinite(Number(a?.sort_order)) ? Number(a.sort_order) : 999;
      const bSort = Number.isFinite(Number(b?.sort_order)) ? Number(b.sort_order) : 999;

      return aSort - bSort;
    })
    .map((image, index) => ({
      ...image,
      color: String(image?.color ?? '').trim().toLowerCase() || null,
      is_primary: Boolean(image?.is_primary),
      sort_order: Number.isFinite(Number(image?.sort_order)) ? Number(image.sort_order) : index,
    }));
}
