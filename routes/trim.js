const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const {getAllTrims, getTrimsByModel, getTrimsBySlug,getTrimsBrandPageProperties, getTrimsYearByModel, getTrimsBySlugAndYear, getTrimsByFilter, getTrimsBodyType, getTrimsFuelType, getTrimsByAdvancedSearch, getTrimsBySlugAndYearWithModel, getCompareTrims, getTrimsByModelMin, getTrimsByModelMinAndYear, getTrimsBodyTypeDynamic, getTrimsFuelTypeDynamic, getTrimsTransmissions, getTrimsTransmissionsDynamic, getTrimsCylinderNoDynamic, getTrimsCylinderNo, getTrimsDriveType, getTrimsDriveTypeDynamic, handleOldURLRedirect } = require("../controllers/trim");

router.route("/").get(getAllTrims);
router.route("/by-model/:model").get(getTrimsByModel);
router.route("/by-model/min/:model").get(getTrimsByModelMin);
router.route("/by-model/min/:model/:year").get(getTrimsByModelMinAndYear);
router.route("/compare/:slug").get(getCompareTrims);
router.route("/:trim").get(getTrimsBySlug);
router.route("/get-years/:modelId").get(getTrimsYearByModel);
router.route("/filter/list").get(getTrimsByFilter);
router.route("/body-type/list").get(getTrimsBodyType).post(getTrimsBodyTypeDynamic);
router.route("/fuel-type/list").get(getTrimsFuelType).post(getTrimsFuelTypeDynamic);
router.route("/transmissions/list").get(getTrimsTransmissions).post(getTrimsTransmissionsDynamic);
router.route("/cylinder-no/list").get(getTrimsCylinderNo).post(getTrimsCylinderNoDynamic);
router.route("/drive-type/list").get(getTrimsDriveType).post(getTrimsDriveTypeDynamic);
router.route("/filter/advanced").post(getTrimsByAdvancedSearch)
router.route("/filter/brand-page-properties").post(getTrimsBrandPageProperties)
router.route("/:trim/:year").get(getTrimsBySlugAndYear);
router.route("/:model/:trim/:year").get(getTrimsBySlugAndYearWithModel);
router.route("/redirect").post(handleOldURLRedirect)

module.exports = router;
