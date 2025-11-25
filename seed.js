/**
 * ============================================
 * DATABASE SEED SCRIPT - FINAL VERSION
 * ============================================
 * Seeds the database with furniture store data
 * Run with: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./src/models/User');       
const Product = require('./src/models/Product'); 
const Category = require('./src/models/Category');
// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Seed Data
const seedData = async () => {
  try {
    console.log('🌱 Starting database seed...\n');

    // 1. Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // 2. Create Admin User
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      fullName: 'Admin User',
      email: 'admin@furniturehaven.com',
      password: 'admin123',
      phone: '+254712345678',
      role: 'admin',
      isVerified: true,
      address: {
        street: '123 Admin Street',
        city: 'Nairobi',
        county: 'Nairobi',
        country: 'Kenya'
      }
    });
    console.log('✅ Admin created:', adminUser.email);
    console.log('   Password: admin123\n');

    // 3. Create Test Customer
    console.log('👤 Creating test customer...');
    const customer = await User.create({
      fullName: 'John Doe',
      email: 'customer@test.com',
      password: 'customer123',
      phone: '+254798765432',
      role: 'customer',
      isVerified: true,
      address: {
        street: '456 Customer Avenue',
        city: 'Nairobi',
        county: 'Nairobi',
        country: 'Kenya'
      }
    });
    console.log('✅ Customer created:', customer.email);
    console.log('   Password: customer123\n');

    // 4. Create Categories (one by one to trigger slug middleware)
    console.log('📁 Creating categories...');
    const categoriesData = [
      {
        name: 'Living Room',
        description: 'Comfortable and stylish furniture for your living space',
        image: {
          url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
          publicId: 'living-room-category'
        }
      },
      {
        name: 'Bedroom',
        description: 'Create your perfect sanctuary with our bedroom collection',
        image: {
          url: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800',
          publicId: 'bedroom-category'
        }
      },
      {
        name: 'Dining',
        description: 'Elegant dining furniture for memorable gatherings',
        image: {
          url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800',
          publicId: 'dining-category'
        }
      },
      {
        name: 'Office',
        description: 'Productive and comfortable workspace solutions',
        image: {
          url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800',
          publicId: 'office-category'
        }
      },
      {
        name: 'Outdoor',
        description: 'Weather-resistant furniture for your outdoor oasis',
        image: {
          url: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800',
          publicId: 'outdoor-category'
        }
      },
      {
        name: 'Decor',
        description: 'Beautiful accessories to complete your space',
        image: {
          url: 'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=800',
          publicId: 'decor-category'
        }
      }
    ];

    const categories = [];
    for (const catData of categoriesData) {
      const category = await Category.create(catData);
      categories.push(category);
    }
    console.log(`✅ ${categories.length} categories created\n`);

    // 5. Create Products (one by one to trigger slug middleware)
    console.log('🛋️  Creating products...');
    const productsData = [
      {
        name: "Florence Velvet Sofa",
        description: "Luxurious 3-seater velvet sofa with solid hardwood frame. Perfect for modern living spaces.",
        price: 45000,
        salePrice: null,
        category: "living-room",
        subcategory: "sofas",
        images: [
          { url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", publicId: "florence-velvet-sofa-1", alt: "Florence Velvet Sofa" },
          { url: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800", publicId: "florence-velvet-sofa-2", alt: "Florence Velvet Sofa side" }
        ],
        specifications: { dimensions: "210cm (W) × 90cm (D) × 85cm (H)", material: "Premium velvet upholstery", color: "Navy Blue", weight: "45kg", assembly: "Partially Required" },
        tags: ["modern", "velvet", "3-seater", "luxury"],
        stock: 5,
        featured: true,
        bestSeller: true,
        newArrival: false,
        createdBy: adminUser._id
      },
      {
        name: "Milan Dining Table",
        description: "Elegant solid wood dining table seats 6 comfortably. Timeless design for family gatherings.",
        price: 38000,
        salePrice: 32000,
        category: "dining",
        subcategory: "tables",
        images: [
          { url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800", publicId: "milan-dining-table-1", alt: "Milan Dining Table" },
          { url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800", publicId: "milan-dining-table-2", alt: "Milan Dining Table detail" }
        ],
        specifications: { dimensions: "180cm (L) × 90cm (W) × 75cm (H)", material: "Solid oak wood", color: "Natural Oak", weight: "55kg", assembly: "Required" },
        tags: ["dining", "oak", "6-seater", "classic"],
        stock: 3,
        featured: true,
        bestSeller: true,
        newArrival: false,
        createdBy: adminUser._id
      },
      {
        name: "Copenhagen Office Chair",
        description: "Ergonomic office chair with lumbar support. Perfect for long working hours.",
        price: 18000,
        salePrice: null,
        category: "office",
        subcategory: "chairs",
        images: [
          { url: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800", publicId: "copenhagen-chair-1", alt: "Copenhagen Office Chair" },
          { url: "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=800", publicId: "copenhagen-chair-2", alt: "Copenhagen Office Chair detail" }
        ],
        specifications: { dimensions: "60cm (W) × 60cm (D) × 110cm (H)", material: "Mesh back, foam cushion", color: "Black", weight: "12kg", assembly: "Partially Required" },
        tags: ["office", "ergonomic", "mesh", "adjustable"],
        stock: 12,
        featured: false,
        bestSeller: true,
        newArrival: false,
        createdBy: adminUser._id
      },
      {
        name: "Modern Platform Bed",
        description: "Low-profile platform bed with upholstered headboard. Queen size.",
        price: 52000,
        salePrice: null,
        category: "bedroom",
        subcategory: "beds",
        images: [
          { url: "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800", publicId: "platform-bed-1", alt: "Modern Platform Bed" },
          { url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800", publicId: "platform-bed-2", alt: "Modern Platform Bed side" }
        ],
        specifications: { dimensions: "160cm (W) × 200cm (L) × 110cm (H)", material: "Upholstered fabric, solid wood", color: "Light Grey", weight: "65kg", assembly: "Required" },
        tags: ["bedroom", "queen", "upholstered", "modern"],
        stock: 4,
        featured: true,
        bestSeller: false,
        newArrival: true,
        createdBy: adminUser._id
      },
      {
        name: "Minimalist Coffee Table",
        description: "Clean-lined coffee table with lower shelf. Perfect for small spaces.",
        price: 15000,
        salePrice: null,
        category: "living-room",
        subcategory: "tables",
        images: [
          { url: "https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=800", publicId: "coffee-table-1", alt: "Minimalist Coffee Table" },
          { url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800", publicId: "coffee-table-2", alt: "Minimalist Coffee Table angle" }
        ],
        specifications: { dimensions: "100cm (L) × 60cm (W) × 40cm (H)", material: "Engineered wood, metal legs", color: "Walnut Brown", weight: "18kg", assembly: "Required" },
        tags: ["living-room", "minimalist", "storage", "small-space"],
        stock: 8,
        featured: false,
        bestSeller: false,
        newArrival: true,
        createdBy: adminUser._id
      },
      {
        name: "Scandinavian Bookshelf",
        description: "5-tier open bookshelf with clean Scandinavian design.",
        price: 22000,
        salePrice: 19000,
        category: "office",
        subcategory: "storage",
        images: [
          { url: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800", publicId: "bookshelf-1", alt: "Scandinavian Bookshelf" },
          { url: "https://images.unsplash.com/photo-1595428773960-5c994b9feeb2?w=800", publicId: "bookshelf-2", alt: "Scandinavian Bookshelf detail" }
        ],
        specifications: { dimensions: "80cm (W) × 30cm (D) × 180cm (H)", material: "Solid pine wood", color: "White", weight: "25kg", assembly: "Required" },
        tags: ["office", "scandinavian", "storage", "bookshelf"],
        stock: 6,
        featured: false,
        bestSeller: false,
        newArrival: true,
        createdBy: adminUser._id
      },
      {
        name: "Outdoor Lounge Set",
        description: "Weather-resistant outdoor lounge set. Includes 2 chairs, sofa, and coffee table.",
        price: 85000,
        salePrice: null,
        category: "outdoor",
        subcategory: "sets",
        images: [
          { url: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800", publicId: "outdoor-set-1", alt: "Outdoor Lounge Set" },
          { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800", publicId: "outdoor-set-2", alt: "Outdoor Lounge Set detail" }
        ],
        specifications: { dimensions: "Various (4-piece set)", material: "Rattan, weatherproof cushions", color: "Natural Rattan", weight: "80kg", assembly: "Partially Required" },
        tags: ["outdoor", "rattan", "set", "weather-resistant"],
        stock: 2,
        featured: true,
        bestSeller: false,
        newArrival: true,
        createdBy: adminUser._id
      },
      {
        name: "Industrial Bar Stools",
        description: "Set of 2 industrial-style bar stools with adjustable height.",
        price: 12000,
        salePrice: null,
        category: "dining",
        subcategory: "stools",
        images: [
          { url: "https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800", publicId: "bar-stools-1", alt: "Industrial Bar Stools" },
          { url: "https://images.unsplash.com/photo-1578991624414-276ef23a534f?w=800", publicId: "bar-stools-2", alt: "Industrial Bar Stools detail" }
        ],
        specifications: { dimensions: "40cm (W) × 40cm (D) × 75-95cm (H)", material: "Metal frame, wood seat", color: "Black Metal, Natural Wood", weight: "8kg each", assembly: "Partially Required" },
        tags: ["dining", "bar-stools", "industrial", "adjustable"],
        stock: 10,
        featured: false,
        bestSeller: true,
        newArrival: false,
        createdBy: adminUser._id
      },
      {
        name: "Classic Wardrobe",
        description: "Spacious 3-door wardrobe with hanging space and shelves.",
        price: 68000,
        salePrice: 58000,
        category: "bedroom",
        subcategory: "storage",
        images: [
          { url: "https://images.unsplash.com/photo-1595428773960-61883e43097b?w=800", publicId: "wardrobe-1", alt: "Classic Wardrobe" },
          { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", publicId: "wardrobe-2", alt: "Classic Wardrobe interior" }
        ],
        specifications: { dimensions: "150cm (W) × 60cm (D) × 200cm (H)", material: "Solid wood, glass mirror", color: "Dark Walnut", weight: "90kg", assembly: "Required" },
        tags: ["bedroom", "wardrobe", "storage", "classic"],
        stock: 3,
        featured: false,
        bestSeller: false,
        newArrival: false,
        createdBy: adminUser._id
      },
      {
        name: "Decorative Wall Mirror",
        description: "Round decorative mirror with gold metal frame. Perfect accent piece.",
        price: 8500,
        salePrice: null,
        category: "decor",
        subcategory: "mirrors",
        images: [
          { url: "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=800", publicId: "mirror-1", alt: "Decorative Wall Mirror" },
          { url: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800", publicId: "mirror-2", alt: "Decorative Wall Mirror detail" }
        ],
        specifications: { dimensions: "80cm diameter", material: "Glass, metal frame", color: "Gold Frame", weight: "4kg", assembly: "Not Required" },
        tags: ["decor", "mirror", "gold", "accent"],
        stock: 15,
        featured: false,
        bestSeller: true,
        newArrival: false,
        createdBy: adminUser._id
      },
      {
        name: "Velvet Accent Chair",
        description: "Elegant velvet accent chair with gold legs. Statement piece for any room.",
        price: 28000,
        salePrice: null,
        category: "living-room",
        subcategory: "chairs",
        images: [
          { url: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800", publicId: "accent-chair-1", alt: "Velvet Accent Chair" },
          { url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800", publicId: "accent-chair-2", alt: "Velvet Accent Chair side" }
        ],
        specifications: { dimensions: "75cm (W) × 80cm (D) × 90cm (H)", material: "Velvet upholstery, metal legs", color: "Emerald Green", weight: "18kg", assembly: "Partially Required" },
        tags: ["living-room", "accent", "velvet", "luxury"],
        stock: 7,
        featured: true,
        bestSeller: false,
        newArrival: true,
        createdBy: adminUser._id
      },
      {
        name: "Minimalist Desk",
        description: "Clean-lined work desk with cable management. Perfect for home office.",
        price: 25000,
        salePrice: null,
        category: "office",
        subcategory: "desks",
        images: [
          { url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800", publicId: "desk-1", alt: "Minimalist Desk" },
          { url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800", publicId: "desk-2", alt: "Minimalist Desk angle" }
        ],
        specifications: { dimensions: "120cm (L) × 60cm (W) × 75cm (H)", material: "Engineered wood, metal legs", color: "White Top, Black Legs", weight: "22kg", assembly: "Required" },
        tags: ["office", "desk", "minimalist", "work-from-home"],
        stock: 9,
        featured: false,
        bestSeller: true,
        newArrival: false,
        createdBy: adminUser._id
      }
    ];

    const products = [];
    for (const prodData of productsData) {
      const product = await Product.create(prodData);
      products.push(product);
    }
    console.log(`✅ ${products.length} products created\n`);

    // 6. Update category product counts
    console.log('🔄 Updating category product counts...');
    for (const category of categories) {
      await category.updateProductCount();
    }
    console.log('✅ Category counts updated\n');

    // Summary
    console.log('📊 SEED SUMMARY:');
    console.log('═══════════════════════════════════════');
    console.log(`👥 Users: ${await User.countDocuments()}`);
    console.log(`📁 Categories: ${await Category.countDocuments()}`);
    console.log(`🛋️  Products: ${await Product.countDocuments()}`);
    console.log('═══════════════════════════════════════\n');

    console.log('🎉 Database seeded successfully!\n');
    console.log('📝 Login Credentials:');
    console.log('   Admin: admin@furniturehaven.com / admin123');
    console.log('   Customer: customer@test.com / customer123\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Run seeder
const runSeeder = async () => {
  try {
    await connectDB();
    await seedData();
    console.log('✅ Seeding complete! Disconnecting...');
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
  }
};

// Execute
runSeeder();