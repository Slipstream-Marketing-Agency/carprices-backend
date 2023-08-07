const express = require("express");
const sequelize = require("./util/database");
const caching = require("./util/caching");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const { errorHandler } = require("./middlewares/errorHandler");
// const temporaryRedirects = require("./temporaryRedirects.json");
// const permanentRedirects = require("./permanentRedirects.json");


// Import Models
const Admin = require("./models/Admin");
const CarBrand = require("./models/CarBrand");

require('dotenv').config()

const app = express();

// Body parser
app.use(express.json({ limit: '50mb' }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// Redirection middleware

// app.use((req, res, next) => {
//   const { path } = req;
//   const temporaryRedirect = temporaryRedirects.find((redirection) => redirection.from === path);
//   const permanentRedirect = permanentRedirects.find((redirection) => redirection.from === path);

//   if (temporaryRedirect) {
//     return res.redirect(307, temporaryRedirect.to); // 302 for temporary redirect
//   }

//   if (permanentRedirect) {
//     return res.redirect(308, permanentRedirect.to); // 301 for permanent redirect
//   }

//   next();
// });

// Route files
const common = require("./routes/common");
const trims = require("./routes/trim");
const models = require("./routes/model");
const blogs = require("./routes/blog");
const brands = require("./routes/brand");
const webstories = require("./routes/webstory");
const adminBrand = require("./routes/admin/brand");
const admin = require("./routes/admin");
const adminBlog = require("./routes/admin/blog");
const adminModel = require("./routes/admin/model");
const adminTrim = require("./routes/admin/trim");
const adminWebstory = require("./routes/admin/webstory");

// Mount routers
app.use(common);
app.use(admin);
app.use("/trim", trims);
app.use("/model", models);
app.use("/blog", blogs)
app.use("/brand", brands)
app.use("/webstory", webstories)
app.use("/admin/brand", adminBrand);
app.use("/admin/blog", adminBlog);
app.use("/admin/model", adminModel);
app.use("/admin/trim", adminTrim);
app.use("/admin/webstory", adminWebstory);

const PORT = process.env.PORT || 8080;

app.use(errorHandler);


const sync = async () => await sequelize.sync();
sync().then(async () => {
  console.log('Databased Synced!'.yellow
  );
  const admin = await Admin.findOne({
    username: "admin_cp"
  });
  if (!admin) {
    Admin.create({
      email: "admin@carprices.ae",
      password: "Test123",
      username: "admin_cp",
      firstName: "Car Prices",
      lastName: "UAE"
    });
  }
});

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);
