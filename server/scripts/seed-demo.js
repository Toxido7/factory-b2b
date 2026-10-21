if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed demo data in production.');
  process.exit(1);
}

// dynamic imports: they run AFTER the guard above
const { prisma } = await import('../src/config/prisma.js');
const { seedDemo } = await import('../src/seed/demoData.js');

try {
  const result = await seedDemo(prisma);
  console.log(`Demo data ready: ${result.categories} categories, ${result.products} products`);
} finally {
  await prisma.$disconnect();
}
