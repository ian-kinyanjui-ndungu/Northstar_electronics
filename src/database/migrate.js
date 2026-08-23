/**
 * Safe migration for TiDB — adds missing columns without touching existing ones.
 * TiDB does not support ALTER TABLE CHANGE COLUMN when a UNIQUE KEY is involved,
 * so we never use sync({ alter: true }). Instead we check each column manually
 * and only issue ADD COLUMN if it is genuinely absent.
 *
 * Run once after adding new model fields:
 *   node src/database/migrate.js
 */
require('dotenv').config();
const { sequelize } = require('./connection');

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name   = :table
       AND column_name  = :column`,
    { replacements: { table, column }, type: sequelize.QueryTypes.SELECT }
  );
  return parseInt(rows.cnt) > 0;
}

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // ── products: sellerId ──────────────────────────────────────────────────
    if (!(await columnExists('products', 'sellerId'))) {
      await sequelize.query(
        'ALTER TABLE `products` ADD COLUMN `sellerId` INT NULL DEFAULT NULL'
      );
      console.log('✅ Added products.sellerId');
    } else {
      console.log('⏭  products.sellerId already exists');
    }

    // ── products: approvalStatus ────────────────────────────────────────────
    if (!(await columnExists('products', 'approvalStatus'))) {
      await sequelize.query(
        "ALTER TABLE `products` ADD COLUMN `approvalStatus` ENUM('Approved','Pending','Rejected') NOT NULL DEFAULT 'Approved'"
      );
      console.log('✅ Added products.approvalStatus');
    } else {
      console.log('⏭  products.approvalStatus already exists');
    }

    // ── Back-fill: mark all existing platform products as Approved ──────────
    await sequelize.query(
      "UPDATE `products` SET `approvalStatus` = 'Approved' WHERE `approvalStatus` IS NULL OR `approvalStatus` = ''"
    );
    console.log('✅ Back-filled approvalStatus on existing products');

    console.log('\n🎉 Migration complete — run `npm start` now.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err.parent?.sqlMessage || '');
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
