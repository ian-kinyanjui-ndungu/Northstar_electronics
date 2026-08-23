const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  action: { type: DataTypes.STRING(200), allowNull: false },
  entity: { type: DataTypes.STRING(100), allowNull: true },
  entityId: { type: DataTypes.INTEGER, allowNull: true },
  details: { type: DataTypes.TEXT, allowNull: true },
  ip: { type: DataTypes.STRING(50), allowNull: true },
}, { tableName: 'audit_logs', timestamps: true, updatedAt: false });

module.exports = AuditLog;
