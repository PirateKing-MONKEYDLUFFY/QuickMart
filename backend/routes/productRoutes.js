const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Category = require("../models/Category");

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get products by category
router.get("/category/:categoryName", async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.categoryName });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new product
router.post("/", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a product
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update product stock
router.patch("/:id/stock", async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined) {
      return res.status(400).json({ error: "Quantity is required" });
    }
    
    // Find product and update quantity
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    product.quantity = quantity;
    // stockStatus will be updated via pre-save middleware
    await product.save();
    
    res.status(200).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get vendor's products
router.get("/vendor/:vendorId", async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.params.vendorId });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CATEGORY ROUTES

// Get all categories
router.get("/categories/all", async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new category
router.post("/categories", async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update category
router.put("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete category
router.delete("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get vendor's categories
router.get("/categories/vendor/:vendorId", async (req, res) => {
  try {
    const categories = await Category.find({ vendorId: req.params.vendorId });
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Process order and reduce stock
router.post("/process-order", async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid order data. Items array is required." });
    }
    
    const processedItems = [];
    const errors = [];
    
    // Process each item in the order
    for (const item of items) {
      if (!item.productId || !item.quantity) {
        errors.push(`Invalid item data: ${JSON.stringify(item)}`);
        continue;
      }
      
      try {
        // Find the product
        const product = await Product.findById(item.productId);
        
        if (!product) {
          errors.push(`Product not found: ${item.productId}`);
          continue;
        }
        
        // Check if enough stock is available
        if (product.quantity < item.quantity) {
          errors.push(`Not enough stock for product: ${product.name}`);
          continue;
        }
        
        // Reduce the stock
        product.quantity -= item.quantity;
        await product.save();
        
        processedItems.push({
          productId: item.productId,
          name: product.name,
          quantityOrdered: item.quantity,
          remainingStock: product.quantity,
          stockStatus: product.stockStatus
        });
      } catch (itemErr) {
        errors.push(`Error processing item ${item.productId}: ${itemErr.message}`);
      }
    }
    
    // Return results
    res.status(200).json({
      success: errors.length === 0,
      processedItems,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error("Order processing error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
