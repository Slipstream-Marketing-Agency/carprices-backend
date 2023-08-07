const express = require("express");
const { getAdminModels, createModel, updateModel, setHighTrim, setFeaturedModels, removeFeaturedModels, getAdminFeaturedModels, getAdminElectricFeaturedModels, setElectricFeaturedModels, removeElectricFeaturedModels, getAdminModelById, getAdminModelByBrand, setAdminHomeListings, getAdminHomeListingsByType, getAdminHomeListings, getAdminHomeListingsById, addOldModelSlug } = require("../../controllers/model");
const router = express.Router();
const { protect } = require("../../middlewares/auth");

router.route("/").get(protect, getAdminModels).post(protect, createModel);
router.route("/set-trim").post(protect, setHighTrim);
router.route("/home-listing/set").post(protect, setAdminHomeListings);
router.route("/home-listing").get(protect, getAdminHomeListings);
router.route("/home-listing/:type").get(protect, getAdminHomeListingsByType);
router.route("/home-listing/id/:id").get(protect, getAdminHomeListingsById);
router.route("/featured").get(protect, getAdminFeaturedModels).post(protect, setFeaturedModels)
router.route("/featured/remove").post(protect, removeFeaturedModels)
router.route("/electric/featured").get(protect, getAdminElectricFeaturedModels).post(protect, setElectricFeaturedModels)
router.route("/electric/featured/remove").post(protect, removeElectricFeaturedModels)
router.route("/by-brand/:brand").get(protect, getAdminModelByBrand)
router.route("/old-slug").post(protect, addOldModelSlug)
router.route("/:model").get(protect, getAdminModelById).post(protect, updateModel);


module.exports = router;
