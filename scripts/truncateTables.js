import { sequelize } from '../config/db.js';

async function truncateAllTables() {
  try {
    // Disable foreign key checks for SQLite
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    
    // Truncate tables
    await sequelize.query('DELETE FROM users;');
    await sequelize.query('DELETE FROM leaves;');
    
    // Enable foreign key checks
    await sequelize.query('PRAGMA foreign_keys = ON;');
    
    console.log('All tables truncated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error truncating tables:', error);
    process.exit(1);
  }
}

truncateAllTables();
