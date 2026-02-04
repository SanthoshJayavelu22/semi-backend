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
  "https://www.semi.org.in",
  "https://semi.org.in",
  "https://backend.semi.org.in",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Allow explicit allowed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow any subdomain of semi.org.in (e.g., https://app.semi.org.in)
    try {
      const hostname = new URL(origin).hostname;
      if (hostname === 'semi.org.in' || hostname.endsWith('.semi.org.in')) {
        return callback(null, true);
      }
    } catch (err) {
      // fall through to reject
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

// Enable CORS for all routes including preflight
app.use(cors({
  origin: true,
  credentials: true
}));

// --- Middleware ---
// Special handling for Stripe Webhook (must be before express.json)
// app.use("/payment/webhook", express.raw({ type: "application/json" }), require("./controllers/paymentController").handleWebhook);

// Increase payload size limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

  
   
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
         
