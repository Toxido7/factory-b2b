import { slugify } from '../utils/slugify.js';

// parents first: a child looks up its parent id
const categories = [
  { name: 'Head Protection' },
  { name: 'Helmets', parent: 'Head Protection' },
  { name: 'Face Shields', parent: 'Head Protection' },
  { name: 'Hand Protection' },
  { name: 'Work Gloves', parent: 'Hand Protection' },
  { name: 'Footwear' },
];

const products = [
  {
    sku: 'HLM-001',
    name: 'Standard Safety Helmet',
    category: 'Helmets',
    price: '18.50',
    minQuantity: 20,
    discountPercent: '5',
  },
  {
    sku: 'HLM-002',
    name: 'Ventilated Safety Helmet',
    category: 'Helmets',
    price: '24.00',
    minQuantity: 10,
    discountPercent: '0',
  },
  {
    sku: 'HLM-003',
    name: 'Welding Helmet',
    category: 'Helmets',
    price: '62.90',
    minQuantity: 5,
    discountPercent: '10',
  },
  {
    sku: 'FSH-001',
    name: 'Clear Face Shield',
    category: 'Face Shields',
    price: '9.75',
    minQuantity: 50,
    discountPercent: '0',
  },
  {
    sku: 'FSH-002',
    name: 'Mesh Face Shield',
    category: 'Face Shields',
    price: '12.40',
    minQuantity: 25,
    discountPercent: '0',
  },
  {
    sku: 'GLV-001',
    name: 'Cotton Work Gloves',
    category: 'Work Gloves',
    price: '2.30',
    minQuantity: 100,
    discountPercent: '15',
  },
  {
    sku: 'GLV-002',
    name: 'Nitrile Coated Gloves',
    category: 'Work Gloves',
    price: '4.80',
    minQuantity: 100,
    discountPercent: '10',
  },
  {
    sku: 'GLV-003',
    name: 'Leather Welding Gloves',
    category: 'Work Gloves',
    price: '14.90',
    minQuantity: 24,
    discountPercent: '0',
  },
  {
    sku: 'FTW-001',
    name: 'Steel Toe Safety Boots',
    category: 'Footwear',
    price: '89.00',
    minQuantity: 6,
    discountPercent: '8',
  },
  {
    sku: 'FTW-002',
    name: 'Slip-Resistant Safety Shoes',
    category: 'Footwear',
    price: '64.50',
    minQuantity: 6,
    discountPercent: '0',
  },
  {
    sku: 'FTW-003',
    name: 'Discontinued Rubber Boots',
    category: 'Footwear',
    price: '35.00',
    minQuantity: 6,
    discountPercent: '0',
    isActive: false,
  },
];

export const seedDemo = async (prisma) => {
  const ids = {};

  for (const { name, parent } of categories) {
    const slug = slugify(name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, parentId: parent ? ids[parent] : null },
    });
    ids[name] = category.id;
  }

  for (const { category, ...data } of products) {
    await prisma.product.upsert({
      where: { sku: data.sku },
      update: {},
      create: { ...data, slug: slugify(data.name), categoryId: ids[category] },
    });
  }

  return { categories: categories.length, products: products.length };
};
