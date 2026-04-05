import { sequelize } from '../config/db.js';
import LeaveDonation from '../models/LeaveDonation.js';

async function createTable() {
  try {
    await sequelize.sync({ force: false });
    console.log('LeaveDonation table created or already exists.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating LeaveDonation table:', error);
    process.exit(1);
  }
}

createTable();
