const AppError = require('../../utils/app-error');
const productsRepository = require('./products.repository');
const {
  serializeCategory,
  serializeProduct,
} = require('./products.presenter');

const getCategories = async () => {
  const categories = await productsRepository.findCategories();

  return categories.map(serializeCategory);
};

const getProducts = async (query) => {
  const data = await productsRepository.findMany(query);

  return {
    items: data.items.map(serializeProduct),
    pagination: data.pagination,
  };
};

const getProductBySlug = async (slug) => {
  const product = await productsRepository.findBySlug(slug);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return serializeProduct(product);
};

const getRelatedProducts = async ({ slug, limit }) => {
  const product = await productsRepository.findBySlug(slug);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const related = await productsRepository.findRelated({
    slug: product.slug,
    categoryId: product.categoryId,
    limit,
  });

  if (related.length >= limit) {
    return related.map(serializeProduct);
  }

  const fallback = await productsRepository.findFallbackRelated({
    slug: product.slug,
    excludeIds: related.map((item) => item.id),
    limit: limit - related.length,
  });

  return related.concat(fallback).map(serializeProduct);
};

module.exports = {
  getCategories,
  getProductBySlug,
  getProducts,
  getRelatedProducts,
};
