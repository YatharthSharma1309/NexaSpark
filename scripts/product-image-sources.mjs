/**
 * Pexels photo IDs used to refresh web/storefront/images/products/{id}.jpg
 * (free license: https://www.pexels.com/license/). IDs match each SKU’s category.
 */
export const PEXELS_PHOTO_ID_BY_PRODUCT = {
  p1: 7480265, // wireless earbuds + charging case
  p2: 7879895, // insulated stainless steel bottle
  p3: 34156906, // cotton t-shirts flat lay
  p4: 7742589, // USB hub with laptop
  p5: 13068362, // desk / table lamp
  p6: 1670766, // running / athletic shoes
  p7: 35490296, // smart TV in living room
  p8: 1682821, // fitness smartwatch on wrist
  p9: 31320336, // pour-over / V60 coffee setup
  p10: 18999339, // backpack
  p11: 14363329, // wireless computer mouse
  p12: 6193815, // rolled yoga mat
};

/** @param {number} photoId */
export function pexelsPhotoJpegUrl(photoId) {
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=800`;
}
