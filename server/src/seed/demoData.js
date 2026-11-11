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
    name: 'Casque de sécurité Atlas',
    category: 'Helmets',
    description: 'Casque léger en polyéthylène haute densité avec harnais réglable à six points. Une protection fiable pour les chantiers et les environnements industriels.',
    images: ['https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&w=1024&q=80'],
    price: '18.50',
    minQuantity: 20,
    discountPercent: '5',
  },
  {
    sku: 'HLM-002',
    name: 'Casque ventilé Aero',
    category: 'Helmets',
    description: 'Casque de chantier ventilé conçu pour améliorer le confort lors des longues journées de travail, avec molette de réglage et bandeau anti-transpiration.',
    images: ['https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1024&q=80'],
    price: '24.00',
    minQuantity: 10,
    discountPercent: '0',
  },
  {
    sku: 'HLM-003',
    name: 'Masque de soudage Eclipse',
    category: 'Helmets',
    description: 'Masque de soudage à assombrissement automatique, vision large et réglage de sensibilité. Adapté aux ateliers de fabrication et de maintenance.',
    images: ['https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1024&q=80'],
    price: '62.90',
    minQuantity: 5,
    discountPercent: '10',
  },
  {
    sku: 'FSH-001',
    name: 'Écran facial ClearView',
    category: 'Face Shields',
    description: 'Écran facial transparent avec visière relevable et serre-tête ajustable. Protège le visage contre les projections tout en conservant une excellente visibilité.',
    images: ['https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=1024&q=80'],
    price: '9.75',
    minQuantity: 50,
    discountPercent: '0',
  },
  {
    sku: 'FSH-002',
    name: 'Écran facial Forest',
    category: 'Face Shields',
    description: 'Visière grillagée légère pour les travaux de débroussaillage et d’entretien extérieur. Le bandeau réglable reste stable pendant les mouvements.',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1024&q=80'],
    price: '12.40',
    minQuantity: 25,
    discountPercent: '0',
  },
  {
    sku: 'GLV-001',
    name: 'Gants de manutention Coton',
    category: 'Work Gloves',
    description: 'Gants tricotés en coton avec poignet élastique, pensés pour la manutention légère, le conditionnement et les opérations répétitives.',
    images: ['https://images.unsplash.com/photo-1581093458791-9d42e3c9b8a2?auto=format&fit=crop&w=1024&q=80'],
    price: '2.30',
    minQuantity: 100,
    discountPercent: '15',
  },
  {
    sku: 'GLV-002',
    name: 'Gants nitrile GripPro',
    category: 'Work Gloves',
    description: 'Gants souples avec enduction nitrile antidérapante pour une bonne prise en main des pièces sèches ou légèrement huileuses.',
    images: ['https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1024&q=80'],
    price: '4.80',
    minQuantity: 100,
    discountPercent: '10',
  },
  {
    sku: 'GLV-003',
    name: 'Gants de soudage Forge',
    category: 'Work Gloves',
    description: 'Gants en cuir pleine fleur avec manchette longue, conçus pour protéger les mains et les avant-bras contre la chaleur et les étincelles.',
    images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1024&q=80'],
    price: '14.90',
    minQuantity: 24,
    discountPercent: '0',
  },
  {
    sku: 'FTW-001',
    name: 'Chaussures de sécurité Titan',
    category: 'Footwear',
    description: 'Chaussures montantes avec embout acier, semelle antidérapante et doublure respirante. Un modèle robuste pour les ateliers et les entrepôts.',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1024&q=80'],
    price: '89.00',
    minQuantity: 6,
    discountPercent: '8',
  },
  {
    sku: 'FTW-002',
    name: 'Chaussures antidérapantes Shift',
    category: 'Footwear',
    description: 'Chaussures de travail basses et confortables avec semelle résistante aux glissades. Idéales pour les équipes de production et de logistique.',
    images: ['https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=1024&q=80'],
    price: '64.50',
    minQuantity: 6,
    discountPercent: '0',
  },
  {
    sku: 'FTW-003',
    name: 'Bottes caoutchouc Hydro',
    category: 'Footwear',
    description: 'Bottes imperméables en caoutchouc avec semelle crantée pour les zones humides et les travaux extérieurs.',
    images: ['https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?auto=format&fit=crop&w=1024&q=80'],
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
      update: { ...data, slug: slugify(data.name), categoryId: ids[category] },
      create: { ...data, slug: slugify(data.name), categoryId: ids[category] },
    });
  }

  return { categories: categories.length, products: products.length };
};
