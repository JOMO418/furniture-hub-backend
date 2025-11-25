/**
 * ============================================
 * DATABASE SEEDER
 * ============================================
 * Seed database with sample data
 * Run: npm run seed
 */

const dotenv = require('dotenv');
const connectDB = require('../config/database');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Load environment variables
dotenv.config();

// Sample categories
const categories = [
  {
    name: 'Living Room',
    slug: 'living-room',
    description: 'Comfortable and stylish furniture for your living space'
  },
  {
    name: 'Bedroom',
    slug: 'bedroom',
    description: 'Quality beds, wardrobes, and bedroom furniture'
  },
  {
    name: 'Dining',
    slug: 'dining',
    description: 'Dining tables, chairs, and dining room sets'
  },
  {
    name: 'Office',
    slug: 'office',
    description: 'Desks, chairs, and office furniture'
  },
  {
    name: 'Outdoor',
    slug: 'outdoor',
    description: 'Garden and patio furniture'
  },
  {
    name: 'Storage',
    slug: 'storage',
    description: 'Shelves, cabinets, and storage solutions'
  }
];

// Sample admin user
const adminUser = {
  fullName: process.env.ADMIN_NAME || 'Admin User',
  email: process.env.ADMIN_EMAIL || 'admin@furniturehub.co.ke',
  password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  phone: '0712345678',
  role: 'admin',
  address: {
    street: 'Kimathi Street',
    city: 'Nairobi',
    county: 'Nairobi',
    country: 'Kenya'
  },
  isVerified: true
};

// Sample products
const sampleProducts = [
  // Living Room
  {
    name: 'Florence Velvet Sofa',
    description: 'Luxurious 3-seater velvet sofa with deep cushioning and solid wood legs. Perfect for modern living rooms.',
    price: 85000,
    salePrice: 75000,
    category: 'living-room',
    specifications: {
      dimensions: '220cm x 90cm x 85cm',
      material: 'Velvet fabric, solid wood frame',
      color: 'Navy Blue',
      weight: '45kg',
      assembly: 'Partially Required'
    },
    tags: ['sofa', 'velvet', 'modern', '3-seater'],
    stock: 12,
    featured: true,
    bestSeller: true,
    images: []
  },
  {
    name: 'Minimalist Coffee Table',
    description: 'Sleek wooden coffee table with clean lines and ample storage space underneath.',
    price: 25000,
    category: 'living-room',
    specifications: {
      dimensions: '120cm x 60cm x 45cm',
      material: 'Solid oak wood',
      color: 'Natural oak',
      weight: '20kg',
      assembly: 'Required'
    },
    tags: ['coffee table', 'wooden', 'minimalist', 'storage'],
    stock: 25,
    newArrival: true,
    images: []
  },
  {
    name: 'Leather Recliner Chair',
    description: 'Premium leather reclining chair with adjustable footrest and lumbar support.',
    price: 55000,
    salePrice: 48000,
    category: 'living-room',
    specifications: {
      dimensions: '95cm x 90cm x 105cm',
      material: 'Genuine leather',
      color: 'Dark Brown',
      weight: '35kg',
      assembly: 'Not Required'
    },
    tags: ['chair', 'recliner', 'leather', 'comfort'],
    stock: 8,
    featured: true,
    images: []
  },
  
  // Bedroom
  {
    name: 'King Size Platform Bed',
    description: 'Modern platform bed with upholstered headboard and built-in storage drawers.',
    price: 120000,
    category: 'bedroom',
    specifications: {
      dimensions: '200cm x 180cm x 120cm',
      material: 'Engineered wood, fabric upholstery',
      color: 'Grey',
      weight: '80kg',
      assembly: 'Required'
    },
    tags: ['bed', 'king size', 'storage', 'upholstered'],
    stock: 6,
    bestSeller: true,
    images: []
  },
  {
    name: '4-Door Wooden Wardrobe',
    description: 'Spacious wardrobe with hanging space, shelves, and drawers for complete bedroom storage.',
    price: 95000,
    salePrice: 85000,
    category: 'bedroom',
    specifications: {
      dimensions: '220cm x 180cm x 60cm',
      material: 'Solid wood',
      color: 'Walnut',
      weight: '100kg',
      assembly: 'Required'
    },
    tags: ['wardrobe', 'storage', 'wooden', 'spacious'],
    stock: 10,
    featured: true,
    images: []
  },
  
  // Dining
  {
    name: '6-Seater Dining Set',
    description: 'Complete dining set with extendable table and 6 comfortable upholstered chairs.',
    price: 150000,
    salePrice: 135000,
    category: 'dining',
    specifications: {
      dimensions: 'Table: 180cm x 90cm x 75cm',
      material: 'Solid wood table, fabric chairs',
      color: 'Natural wood with beige chairs',
      weight: '120kg total',
      assembly: 'Required'
    },
    tags: ['dining set', 'extendable', '6-seater', 'upholstered'],
    stock: 5,
    featured: true,
    bestSeller: true,
    images: []
  },
  {
    name: 'Modern Bar Stools Set of 4',
    description: 'Adjustable height bar stools with swivel seats and footrest.',
    price: 35000,
    category: 'dining',
    specifications: {
      dimensions: '45cm x 45cm x 60-80cm (adjustable)',
      material: 'Metal frame, faux leather seat',
      color: 'Black',
      weight: '8kg each',
      assembly: 'Partially Required'
    },
    tags: ['bar stools', 'modern', 'adjustable', 'swivel'],
    stock: 20,
    newArrival: true,
    images: []
  },
  
  // Office
  {
    name: 'Executive Office Desk',
    description: 'Large executive desk with drawers, keyboard tray, and cable management.',
    price: 75000,
    category: 'office',
    specifications: {
      dimensions: '160cm x 80cm x 75cm',
      material: 'Engineered wood',
      color: 'Dark espresso',
      weight: '60kg',
      assembly: 'Required'
    },
    tags: ['desk', 'executive', 'office', 'drawers'],
    stock: 15,
    featured: true,
    images: []
  },
  {
    name: 'Ergonomic Office Chair',
    description: 'High-back ergonomic chair with lumbar support, armrests, and tilt mechanism.',
    price: 28000,
    salePrice: 24000,
    category: 'office',
    specifications: {
      dimensions: '65cm x 65cm x 115cm',
      material: 'Mesh back, padded seat',
      color: 'Black',
      weight: '18kg',
      assembly: 'Partially Required'
    },
    tags: ['chair', 'ergonomic', 'office', 'mesh'],
    stock: 30,
    bestSeller: true,
    images: []
  },
  
  // Storage
  {
    name: '5-Tier Bookshelf',
    description: 'Open bookshelf with 5 spacious tiers for books, decor, and storage.',
    price: 18000,
    category: 'storage',
    specifications: {
      dimensions: '180cm x 80cm x 30cm',
      material: 'Engineered wood',
      color: 'White',
      weight: '25kg',
      assembly: 'Required'
    },
    tags: ['bookshelf', 'storage', 'open', 'shelves'],
    stock: 40,
    newArrival: true,
    images: []
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    
    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();

    console.log('✅ Data cleared');

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await User.create(adminUser);
    console.log(`✅ Admin created: ${admin.email}`);

    // Create categories
    console.log('📁 Creating categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ ${createdCategories.length} categories created`);

    // Add admin ID to products
    const productsWithAdmin = sampleProducts.map(product => ({
      ...product,
      createdBy: admin._id
    }));

    // Create products
    console.log('📦 Creating products...');
    const createdProducts = await Product.insertMany(productsWithAdmin);
    console.log(`✅ ${createdProducts.length} products created`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Admin Login Credentials:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${adminUser.password}`);
    console.log('\n⚠️  IMPORTANT: Change admin password after first login!\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();