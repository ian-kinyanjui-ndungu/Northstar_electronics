require('dotenv').config();
const { Sequelize } = require('sequelize');

// DB_SSL=true  → TiDB Cloud (SSL required)
// DB_SSL=false → Local TiDB / TiDB Serverless with no-SSL flag
const isSSL = process.env.DB_SSL !== 'false';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'northstar',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 4000,
    dialect: 'mysql',
    logging: false,
    dialectOptions: isSSL
      ? {
          ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true,
          },
        }
      : {},
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = { sequelize };
