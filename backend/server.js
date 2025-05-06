const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/users"); // Import User model
const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(express.json()); // for parsing JSON from frontend

// Add CORS middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/ecommerceDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log("MongoDB error", err));

// Routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);

// Home route
app.get('/', (req, res) => {
  res.send('🚀 QuickMart backend is running!');
});

// Add test login route that doesn't depend on MongoDB
app.post('/test-login', (req, res) => {
    const { email, password, role } = req.body;
    console.log("Test login attempt:", email);
    
    // Always succeed for testing
    return res.status(200).json({ 
        message: 'Login successful (test mode)', 
        role: role || 'Customer',
        user: {
            email: email,
            name: email.split('@')[0]
        }
    });
});

// Auth routes
app.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const newUser = new User({ name, email, password, role });
        await newUser.save();
        res.status(200).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        let user = await User.findOne({ email });

        // Allow test login if database is empty or user doesn't exist
        if (!user) {
            // For development/testing - allow any login
            console.log("Test login for:", email);
            return res.status(200).json({ 
                message: 'Login successful (test mode)', 
                role: role || 'Customer',
                user: {
                    email: email,
                    name: email.split('@')[0]
                }
            });
        }

        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        res.status(200).json({ 
            message: 'Login successful', 
            role: user.role || 'Customer',
            user: {
                email: user.email,
                name: user.name
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
