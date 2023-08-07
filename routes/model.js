const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const { getModels,getAllYearModelsURL,getModelsTableListByBrandSlug, getFeaturedModels, getElectricFeaturedModels, getModelsByBrand, getModelsByBrandAndYear, getModelsByBrandSlug, getModelsByBrandAndYearSlug, getModelsByBrandMin, getModelsBySlug, searchModels, topMostSearchedCars, compareCarModels, getSpecificModels, getModelsBySlugAndYear, getModelsBySlugBrandAndYear, getModelsBySlugBrand, getPopularModelsByBrand, handleOldModelURLRedirect, getOldSlugModel } = require("../controllers/model");

router.route("/").get(getModels);
router.route("/getallyearmodelsurl").get(getAllYearModelsURL);
router.route("/search").get(searchModels);
router.route("/top-searched").get(topMostSearchedCars);
router.route("/popular-by-brand").post(getPopularModelsByBrand);
router.route("/compare-car/list").get(compareCarModels)
router.route("/by-brand/:brand").get(getModelsByBrand)
router.route("/by-brand/min/:brand").get(getModelsByBrandMin)
router.route("/by-brand-year/:brand/:year").get(getModelsByBrandAndYear)
router.route("/by-brand/slug/:brand").get(getModelsByBrandSlug)
router.route("/by-brand-table-listing/slug/:brand").get(getModelsTableListByBrandSlug)
router.route("/by-brand-year/slug/:brand/:year").get(getModelsByBrandAndYearSlug)
router.route("/featured").get(getFeaturedModels);
router.route("/featured/electric").get(getElectricFeaturedModels);
router.route("/old-slug/:slug").get(getOldSlugModel)
router.route("/:model").get(getModelsBySlug);
router.route("/:brand/:model").get(getModelsBySlugBrand);
router.route("/:brand/:model/:year").get(getModelsBySlugBrandAndYear);
router.route("/redirect").post(handleOldModelURLRedirect)

router.route("/specific").post(getSpecificModels);

module.exports = router;
