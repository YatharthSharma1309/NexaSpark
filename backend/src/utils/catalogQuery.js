const buildCatalogQuery = (query) => {
  const filters = {};
  const pagination = {};
  const sort = {};

  if (query.category) filters.category = query.category;
  if (query.brand) filters.brand = query.brand;
  if (query.minPrice || query.maxPrice) {
    filters.price = {};
    if (query.minPrice) filters.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filters.price.$lte = Number(query.maxPrice);
  }
  if (query.minRating) filters.rating = { $gte: Number(query.minRating) };
  if (query.search) filters.$text = { $search: query.search };

  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Math.min(Number(query.limit), 50) : 12;
  pagination.skip = (page - 1) * limit;
  pagination.limit = limit;
  pagination.page = page;

  if (query.sortBy === "price_asc") sort.price = 1;
  else if (query.sortBy === "price_desc") sort.price = -1;
  else if (query.sortBy === "rating_desc") sort.rating = -1;
  else sort.createdAt = -1;

  return { filters, pagination, sort };
};

module.exports = buildCatalogQuery;
