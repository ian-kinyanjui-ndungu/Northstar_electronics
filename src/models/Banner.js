const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Banner = sequelize.define('Banner', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  subtitle: { type: DataTypes.STRING(300), allowNull: true },
  imageUrl: { type: DataTypes.STRING(500), allowNull: true },
  linkUrl: { type: DataTypes.STRING(500), allowNull: true },
  position: { type: DataTypes.ENUM('hero', 'promo', 'category', 'sidebar'), defaultValue: 'hero' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  bgColor: { type: DataTypes.STRING(20), allowNull: true },
}, { tableName: 'banners', timestamps: true });

module.exports = Banner;
