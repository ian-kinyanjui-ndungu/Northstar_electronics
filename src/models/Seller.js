const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Seller = sequelize.define('Seller', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  businessName: { type: DataTypes.STRING(200), allowNull: false },
  slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  logo: { type: DataTypes.STRING(500), allowNull: true },
  email: { type: DataTypes.STRING(150), allowNull: false },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true },
  country: { type: DataTypes.STRING(100), defaultValue: 'US' },
  kycStatus: { type: DataTypes.ENUM('Pending', 'Submitted', 'Verified', 'Rejected'), defaultValue: 'Pending' },
  status: { type: DataTypes.ENUM('Active', 'Suspended', 'Pending'), defaultValue: 'Pending' },
  commissionRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 10.00 },
  walletBalance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  totalSales: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0.00 },
}, { tableName: 'sellers', timestamps: true });

module.exports = Seller;
