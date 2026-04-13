require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/database');
const { initSocket } = require('./config/socket');
const User = require('./models/User');
const Service = require('./models/Service');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Auto-seed database if empty (runs on first deployment)
const autoSeed = async () => {
  try {
    const userCount = await User.countDocuments();
    const serviceCount = await Service.countDocuments();

    if (userCount > 0 && serviceCount > 0) {
      console.log('📦 Database already seeded, skipping auto-seed.');
      return;
    }

    console.log('🌱 Database is empty — running auto-seed...');

    // Import seed data inline to avoid re-running full seed.js
    const bcrypt = require('bcryptjs');

    // Create demo users
    const users = [
      {
        name: 'Dhiraj Ame',
        email: 'admin@helpshack.in',
        password: await bcrypt.hash('admin123', 12),
        phone: '+918924954143',
        role: 'admin',
        isVerified: true,
      },
      {
        name: 'Rahul Sharma',
        email: 'employee@helpshack.in',
        password: await bcrypt.hash('employee123', 12),
        phone: '+919876543210',
        role: 'employee',
        department: 'Tax & Compliance',
        designation: 'Senior Associate',
        isVerified: true,
      },
      {
        name: 'Priya Gupta',
        email: 'client@helpshack.in',
        password: await bcrypt.hash('client123', 12),
        phone: '+919123456789',
        role: 'client',
        companyName: 'Gupta Enterprises',
        isVerified: true,
      },
    ];

    if (userCount === 0) {
      await User.insertMany(users);
      console.log('✅ Demo users created (admin, employee, client)');
    }

    if (serviceCount === 0) {
      // Dynamically load services array from seed.js
      const { services } = require('./seedData');
      await Service.insertMany(services);
      console.log(`✅ ${services.length} services created`);
    }

    console.log('🎉 Auto-seed complete!');
    console.log('   Admin:    admin@helpshack.in / admin123');
    console.log('   Employee: employee@helpshack.in / employee123');
    console.log('   Client:   client@helpshack.in / client123');
  } catch (err) {
    console.error('⚠️  Auto-seed error (non-fatal):', err.message);
  }
};

// Connect to database and start server
connectDB().then(async () => {
  await autoSeed();
  server.listen(PORT, () => {
    console.log(`🚀 Helpshack API running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  });
}).catch((err) => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
