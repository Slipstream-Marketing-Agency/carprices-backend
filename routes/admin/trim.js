const express = require("express");
const { getAdminTrims, createTrim, updateTrim, getAdminTrimById, changeTrimData, changeTrimImageURL, changeTrimGalleryImageURL } = require("../../controllers/trim");
const router = express.Router();
const { protect } = require("../../middlewares/auth");

router.route("/").get(protect, getAdminTrims).post(protect, createTrim);
router.route("/:trim").get(protect, getAdminTrimById).put(protect, updateTrim);

// router.route("/change/data").post(changeTrimData)
// router.route("/change/image-url").post(changeTrimImageURL)
// router.route("/change/gallery/image-url").post(changeTrimGalleryImageURL)


module.exports = router;
