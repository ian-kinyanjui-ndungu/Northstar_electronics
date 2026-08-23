const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const WithdrawalRequest = sequelize.define('WithdrawalRequest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sellerId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM('Pending', 'Approved', 'Paid', 'Rejected'), defaultValue: 'Pending' },
  method: { type: DataTypes.STRING(80), defaultValue: 'Bank Transfer' },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'withdrawal_requests', timestamps: true });

module.exports = WithdrawalRequest;
