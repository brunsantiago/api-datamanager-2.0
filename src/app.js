const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const mobileRoutes = require("./routes/mobile.routes.js");
const provisioningRoutes = require("./routes/provisioning.routes.js");
const accountRoutes = require("./routes/account.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const adminRoutes = require("./routes/admin.routes.js");
const webRoutes = require("./routes/web.routes.js");
const indexRoutes = require("./routes/index.routes.js");

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'https://webadmin-4fa05.web.app',
    'https://webadmin-4fa05.firebaseapp.com',
    'http://localhost:4200',
    'http://localhost:4201'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(cors(corsOptions));

// Routes
app.use("/", indexRoutes);
app.use("/api/v2", authRoutes);         // Authentication routes (Firebase + API Key)
app.use("/api/v2", adminRoutes);        // Admin routes (Accounts, Entities, Users management)
app.use("/api/v2", mobileRoutes);       // Mobile App - Con JWT
app.use("/api/v2", webRoutes);          // WebAdmin routes - Firebase Token authentication
app.use("/api/v2", provisioningRoutes); // Provisioning routes (Company configuration)
app.use("/api/v2", accountRoutes);      // Account & Entity routes (Multi-tenant)

app.use((req, res, next) => {
  res.status(404).json({ message: "Not found" });
});

//export default app;
module.exports = app;
