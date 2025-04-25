const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  imageUrl: String, // Can be a public image link
});

module.exports = mongoose.model("Product", productSchema);
