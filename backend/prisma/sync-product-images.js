const fs = require('fs');
const path = require('path');

const productData = require('./product-data');

const rootPath = path.resolve(__dirname, '..', '..');
const sourcePath = path.join(rootPath, 'frontend', 'assets', 'images', 'figma', 'products');
const targetPath = path.join(rootPath, 'frontend', 'assets', 'images', 'products');

fs.mkdirSync(targetPath, { recursive: true });

for (const product of productData.products) {
  const sourceFile = path.join(sourcePath, product.sourceImage);
  const targetFile = path.join(targetPath, product.imageFile);

  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Missing source image: ${sourceFile}`);
  }

  fs.copyFileSync(sourceFile, targetFile);
}

console.log(`Synced ${productData.products.length} product images to ${targetPath}`);
