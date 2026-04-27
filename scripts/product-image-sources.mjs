/**
 * Pexels photo IDs used to refresh web/storefront/images/products/{id}.jpg
 * (free license: https://www.pexels.com/license/). IDs match each SKU’s category.
 */
export const PEXELS_PHOTO_ID_BY_PRODUCT = {
  /* Featured-home spotlight (p1,p8,p6,p3,p7,p4,p9,p10) — refreshed art */
  p1: 9890196, // wireless earbuds / in-ear audio
  p2: 7879895, // insulated stainless steel bottle
  p3: 4066293, // casual / crew apparel flat lay
  p4: 4195398, // USB-C hub + laptop workspace
  p5: 13068362, // desk / table lamp
  p6: 15592489, // athletic sneakers close-up
  p7: 33805706, // television / living-room screen
  p8: 437037, // smartwatch on wrist
  p9: 3028996, // coffee / pour-over bar
  p10: 2909441, // travel / laptop backpack
  p11: 14363329, // wireless computer mouse
  p12: 6193815, // rolled yoga mat
};

/** @param {number} photoId */
export function pexelsPhotoJpegUrl(photoId) {
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=800`;
}
