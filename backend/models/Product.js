const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  imageUrl: String, // Can be a public image link
  category: String, // Category of the product
  quantity: {
    type: Number,
    default: 0
  },
  stockStatus: {
    type: String,
    enum: ['Out of Stock', 'Low Stock', 'In Stock'],
    default: 'Out of Stock'
  },
  vendorId: String // To identify which vendor added this product
});

// Pre-save middleware to automatically set stockStatus based on quantity
productSchema.pre('save', function(next) {
  if (this.quantity <= 0) {
    this.stockStatus = 'Out of Stock';
  } else if (this.quantity < 10) {
    this.stockStatus = 'Low Stock';
  } else {
    this.stockStatus = 'In Stock';
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
