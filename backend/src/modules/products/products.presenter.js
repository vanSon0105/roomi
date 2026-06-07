const toNumber = (value) => (value == null ? null : Number(value));

const splitSuitableFor = (value) =>
  (value || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);

const serializeImage = (image) => ({
  id: image.id,
  imageUrl: image.imageUrl,
  altText: image.altText,
  sortOrder: image.sortOrder,
  isPrimary: image.isPrimary,
});

const serializeProduct = (product) => {
  const images = product.images || [];
  const primaryImage = images.find((image) => image.isPrimary) || images[0] || null;

  return {
    id: product.slug,
    databaseId: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    suitableFor: product.suitableFor,
    bullets: splitSuitableFor(product.suitableFor),
    price: toNumber(product.price),
    compareAtPrice: toNumber(product.compareAtPrice),
    rating: toNumber(product.rating),
    stock: product.stock,
    status: product.status,
    isFeatured: product.isFeatured,
    category: product.category?.slug || null,
    categoryLabel: product.category?.name || 'Chưa phân loại',
    imageUrl: primaryImage?.imageUrl || null,
    images: images.map(serializeImage),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

const serializeCategory = (category) => ({
  id: category.slug,
  databaseId: category.id,
  name: category.name,
  label: category.name,
  slug: category.slug,
  description: category.description,
  productCount: category._count?.products || 0,
});

module.exports = {
  serializeCategory,
  serializeProduct,
};
