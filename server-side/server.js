const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");


dotenv.config();

const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

// Enable CORS for all routes including preflight
app.use(cors(corsOptions));

// --- Middleware ---
// Special handling for Stripe Webhook (must be before express.json)
// app.use("/payment/webhook", express.raw({ type: "application/json" }), require("./controllers/paymentController").handleWebhook);

app.use(express.json());

  
   
// --- MongoDB Connection ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ DB connected");
    // initStatusScheduler();
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err);
  });

// --- Routes ---
app.use('/api/membership', require('./routes/membershipRoutes'));
app.use('/api/newsletter', require('./routes/newsletterRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 404 Not Found Handler ---     
app.use((req, res, next) => {
  const error = new Error("Route not found");
  error.statusCode = 404;
  next(error);
});
 
// --- Global Error Handler ---
app.use(require('./middleware/errorMiddleware'));

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
         