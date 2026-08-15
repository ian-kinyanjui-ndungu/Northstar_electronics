const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Return = require('./Return');
const Seller = require('./Seller');
const Wishlist = require('./Wishlist');
const Review = require('./Review');
const Coupon = require('./Coupon');
const Brand = require('./Brand');
const Category = require('./Category');
const Banner = require('./Banner');
const AuditLog = require('./AuditLog');
const Notification = require('./Notification');
const WithdrawalRequest = require('./WithdrawalRequest');

// --- Existing ---
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Order.hasOne(Return, { foreignKey: 'orderId', as: 'returnRequest' });
Return.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
User.hasMany(Return, { foreignKey: 'userId', as: 'returns' });
Return.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- New ---
User.hasOne(Seller, { foreignKey: 'userId', as: 'seller' });
Seller.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Seller.hasMany(Product, { foreignKey: 'sellerId', as: 'products' });
Product.belongsTo(Seller, { foreignKey: 'sellerId', as: 'seller' });

User.hasMany(Wishlist, { foreignKey: 'userId', as: 'wishlistItems' });
Wishlist.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Product.hasMany(Wishlist, { foreignKey: 'productId', as: 'wishlistedBy' });
Wishlist.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Seller.hasMany(WithdrawalRequest, { foreignKey: 'sellerId', as: 'withdrawals' });
WithdrawalRequest.belongsTo(Seller, { foreignKey: 'sellerId', as: 'seller' });

Category.hasMany(Category, { foreignKey: 'parentId', as: 'children' });
Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });

module.exports = {
  User, Product, Order, OrderItem, Return,
  Seller, Wishlist, Review, Coupon, Brand,
  Category, Banner, AuditLog, Notification, WithdrawalRequest,
};
