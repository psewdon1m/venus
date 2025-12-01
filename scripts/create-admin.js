#!/usr/bin/env node

// Create default admin user for testing
// Usage: node scripts/create-admin.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const adminEmail = 'admin@venus.app';
    const adminPassword = 'admin123!@#';

    // Check if admin already exists
    const existingAdmin = await prisma.account.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await prisma.account.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('Password:', adminPassword);
    console.log('\n⚠️  WARNING: Change this password in production!');

  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();