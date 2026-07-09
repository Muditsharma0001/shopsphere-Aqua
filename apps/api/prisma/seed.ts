import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  const passwordHash = bcrypt.hashSync('password123', 10);
  await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@shopsphere.com',
        name: 'Admin User',
        passwordHash,
        role: Role.ADMIN,
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'seller1@shopsphere.com',
        name: 'Seller One',
        passwordHash,
        role: Role.SELLER,
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'seller2@shopsphere.com',
        name: 'Seller Two',
        passwordHash,
        role: Role.SELLER,
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'customer1@shopsphere.com',
        name: 'Customer One',
        passwordHash,
        role: Role.CUSTOMER,
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'customer2@shopsphere.com',
        name: 'Customer Two',
        passwordHash,
        role: Role.CUSTOMER,
        isVerified: true,
      },
    }),
  ]);

  console.log('Seeding categories...');
  const categoryNames = [
    'Electronics',
    'Fashion & Apparel',
    'Home & Kitchen',
    'Books & Stationery',
    'Beauty & Personal Care',
    'Sports & Outdoors',
    'Toys & Games',
    'Automotive',
    'Grocery & Gourmet',
    'Health & Wellness',
  ];
  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.create({
        data: {
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        },
      })
    )
  );

  console.log('Seeding brands...');
  const brandNames = ['TechGiant', 'StyleCo', 'EcoHome', 'FitLife', 'PureBeauty'];
  const brands = await Promise.all(
    brandNames.map((name) =>
      prisma.brand.create({
        data: {
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        },
      })
    )
  );

  console.log('Seeding products...');
  const imagesPool = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60', // watch
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60', // headphones
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60', // shoe
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60', // sunglasses
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&auto=format&fit=crop&q=60', // hair dryer
  ];

  for (let i = 1; i <= 50; i++) {
    const category = categories[(i - 1) % categories.length];
    const brand = brands[(i - 1) % brands.length];
    const price = Math.round((Math.random() * 500 + 10) * 100) / 100;
    const hasDiscount = Math.random() > 0.5;
    const compareAtPrice = hasDiscount ? Math.round(price * 1.25 * 100) / 100 : null;
    const stock = Math.floor(Math.random() * 150) + 5;
    
    const product = await prisma.product.create({
      data: {
        name: `Product ${i} (${brand.name} ${category.name})`,
        slug: `product-${i}-${brand.slug}-${category.slug}`,
        description: `This is a high quality description for Product ${i}. Built by ${brand.name} in the ${category.name} category, it represents the pinnacle of utility and modern design elements.`,
        price,
        compareAtPrice,
        stock,
        categoryId: category.id,
        brandId: brand.id,
      },
    });

    await prisma.productImage.create({
      data: {
        url: imagesPool[(i - 1) % imagesPool.length],
        isFeatured: true,
        productId: product.id,
      },
    });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
