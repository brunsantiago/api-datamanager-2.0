const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const employeesRoutesV1 = require("./routes/employees.routes.v1.js");
const employeesRoutesV2 = require("./routes/employees.routes.v2.js");
const provisioningRoutes = require("./routes/provisioning.routes.js");
const accountRoutes = require("./routes/account.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const adminRoutes = require("./routes/admin.routes.js");
const webRoutes = require("./routes/web.routes.js");
const indexRoutes = require("./routes/index.routes.js");

const app = express();

// Middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(cors());

// Routes
app.use("/", indexRoutes);
app.use("/api/v2", authRoutes);         // Authentication routes (Firebase + API Key)
app.use("/api/v2", adminRoutes);        // Admin routes (Accounts, Entities, Users management)
app.use("/api/v1", employeesRoutesV1);  // Version 1 - Sin JWT
app.use("/api/v2", employeesRoutesV2);  // Version 2 - Con JWT (Mobile App)
app.use("/api/v2", webRoutes);          // WebAdmin routes - Firebase Token authentication
app.use("/api/v2", provisioningRoutes); // Provisioning routes (Company configuration)
app.use("/api/v2", accountRoutes);      // Account & Entity routes (Multi-tenant)
app.use("/api", employeesRoutesV1);     // Backward compatibility (default a v1)

app.use((req, res, next) => {
  res.status(404).json({ message: "Not found" });
});

//export default app;
module.exports = app;
