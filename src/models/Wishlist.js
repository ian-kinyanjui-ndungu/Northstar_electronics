const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Wishlist = sequelize.define('Wishlist', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'wishlists', timestamps: true });

module.exports = Wishlist;
