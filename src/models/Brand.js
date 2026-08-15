const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Brand = sequelize.define('Brand', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  logo: { type: DataTypes.STRING(500), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'brands', timestamps: true });

module.exports = Brand;
