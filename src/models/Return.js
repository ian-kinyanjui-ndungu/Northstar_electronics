const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Return = sequelize.define('Return', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM('Requested', 'Approved', 'Rejected', 'Refunded'),
    defaultValue: 'Requested',
    allowNull: false,
  },
  adminNotes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'returns', timestamps: true });

module.exports = Return;
