const bcrypt = require('bcrypt');

const prisma = require('../src/config/prisma');

const adminEmail = process.env.ADMIN_EMAIL || 'admin@roomi.com.vn';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
const adminName = process.env.ADMIN_NAME || 'ROOMI Admin';

const categories = [
  {
    name: 'Đèn trang trí',
    slug: 'den-trang-tri',
    description: 'Đèn ngủ, đèn bàn và các mẫu đèn decor cho không gian sống.',
  },
  {
    name: 'Nến thơm',
    slug: 'nen-thom',
    description: 'Nến thơm và phụ kiện tạo hương cho phòng ngủ, phòng khách.',
  },
  {
    name: 'Tranh decor',
    slug: 'tranh-decor',
    description: 'Tranh treo tường, tranh để bàn và tranh trang trí theo mùa.',
  },
  {
    name: 'Phụ kiện decor',
    slug: 'phu-kien-decor',
    description: 'Các sản phẩm trang trí nhỏ cho bàn làm việc và góc chill.',
  },
];

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

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
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
