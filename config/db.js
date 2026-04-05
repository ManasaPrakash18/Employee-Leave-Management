import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || 'database.sqlite',
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to the SQLite database has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the SQLite database:', error);
  }
};

export { sequelize, connectDB };
