const express = require("express");
const { getAdminBrands, createBrand, getAdminBrandById, updateBrand } = require("../../controllers/brand");
const router = express.Router();
const { protect } = require("../../middlewares/auth");

router.route("/").get(protect, getAdminBrands).post(protect, createBrand);
router.route("/by-id/:id").get(protect, getAdminBrandById).put(protect, updateBrand);

module.exports = router;
