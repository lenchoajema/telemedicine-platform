#!/usr/bin/env node

import mongoose from 'mongoose';
import User from './src/modules/auth/user.model.js';

async function listUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/telemedicine');
        console.log('Connected to MongoDB');

        // Get all users
        const users = await User.find({}, { password: 0 }).lean();
        console.log('Existing users:');
        console.log(JSON.stringify(users, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listUsers();
