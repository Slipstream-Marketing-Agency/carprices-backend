const express = require("express");
const { getCarBrandBySlug, getPopularCarBrand } = require("../controllers/brand");
const router = express.Router();
const { protect } = require("../middlewares/auth");

router.route("/by-slug/:slug").get(getCarBrandBySlug);
router.route("/popular").get(getPopularCarBrand);

module.exports = router;