const bcrypt = require('bcrypt');

const prisma = require('../src/config/prisma');
const productData = require('./product-data');

const adminEmail = process.env.ADMIN_EMAIL || 'admin@roomi.com.vn';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
const adminName = process.env.ADMIN_NAME || 'ROOMI Admin';

const buildShortDescription = (description) =>
  description.length > 240 ? `${description.slice(0, 237).trim()}...` : description;

async function main() {
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: 'ADMIN',
    },
    create: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const categoryBySlug = new Map();

  await prisma.category.deleteMany({
    where: {
      slug: 'phu-kien-decor',
      products: {
        none: {},
      },
    },
  });

  for (const category of productData.categories) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
    });

    categoryBySlug.set(savedCategory.slug, savedCategory);
  }

  for (const product of productData.products) {
    const category = categoryBySlug.get(product.categorySlug);

    if (!category) {
      throw new Error(`Missing category for product ${product.slug}`);
    }

    const savedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        categoryId: category.id,
        name: product.name,
        shortDescription: buildShortDescription(product.description),
        description: product.description,
        price: product.price,
        rating: product.rating,
        suitableFor: product.suitableFor,
        status: 'ACTIVE',
        stock: 100,
      },
      create: {
        categoryId: category.id,
        name: product.name,
        slug: product.slug,
        shortDescription: buildShortDescription(product.description),
        description: product.description,
        price: product.price,
        rating: product.rating,
        suitableFor: product.suitableFor,
        status: 'ACTIVE',
        stock: 100,
      },
    });

    await prisma.productImage.deleteMany({
      where: {
        productId: savedProduct.id,
        isPrimary: true,
      },
    });

    await prisma.productImage.create({
      data: {
        productId: savedProduct.id,
        imageUrl: product.imageUrl,
        altText: product.name,
        sortOrder: 0,
        isPrimary: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
