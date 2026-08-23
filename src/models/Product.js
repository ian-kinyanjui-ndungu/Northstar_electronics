const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  category: { type: DataTypes.ENUM('Laptops', 'Desktops', 'Monitors', 'Accessories'), allowNull: false },
  stock: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  image: { type: DataTypes.STRING(500), defaultValue: null },
  featured: { type: DataTypes.BOOLEAN, defaultValue: false },
  // Marketplace fields
  sellerId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
  approvalStatus: {
    type: DataTypes.ENUM('Approved', 'Pending', 'Rejected'),
    defaultValue: 'Approved', // platform products are pre-approved
    allowNull: false,
  },
}, { tableName: 'products', timestamps: true });

module.exports = Product;
