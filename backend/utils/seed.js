const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Workflow = require('../models/Workflow');
const Step = require('../models/Step');
const Task = require('../models/Task');
const Execution = require('../models/Execution');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB...');

  // Clear everything
  await User.deleteMany({});
  await Workflow.deleteMany({});
  await Step.deleteMany({});
  await Task.deleteMany({});
  await Execution.deleteMany({});

  // Create Admin
  const admin = await User.create({
    name: 'System Administrator',
    email: 'admin@gmail.com',
    password: 'admin123',
    role: 'admin',
  });
  console.log('✅ Admin: admin@gmail.com / admin123');

  // Create Demo Users
  await User.create({
    name: 'John Manager',
    email: 'manager@company.com',
    password: 'password123',
    role: 'manager',
    createdBy: admin._id,
  });

  await User.create({
    name: 'Jane Employee',
    email: 'employee@company.com',
    password: 'password123',
    role: 'employee',
    createdBy: admin._id,
  });

  await User.create({
    name: 'Bob Finance',
    email: 'finance@company.com',
    password: 'password123',
    role: 'finance',
    createdBy: admin._id,
  });

  console.log('✅ Demo users created');
  console.log('\n🎉 Seed complete! No workflows created.');
  console.log('   Login as admin and create workflows from the dashboard.');
  console.log('\n   Credentials:');
  console.log('   Admin:    admin@gmail.com / admin123');
  console.log('   Manager:  manager@company.com / password123');
  console.log('   Employee: employee@company.com / password123');
  console.log('   Finance:  finance@company.com / password123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});