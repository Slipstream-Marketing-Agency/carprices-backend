const express = require("express");
const router = express.Router();
const {
  getCarBrands, mainSearch, contactFormSubmit, subscriptionFormSubmit,
} = require("../controllers/common");
const { getTrimMinMaxFilterPrice, getTrimMinMaxFilterPower, getTrimMinMaxFilterTorque, getTrimMinMaxFilterPriceDynamic, getTrimMinMaxFilterPowerDynamic, getTrimMinMaxFilterTorqueDynamic, getTrimMinMaxFilterDisplacementDynamic, getTrimMinMaxFilterDisplacement, getCarBrandsDynamic } = require("../controllers/trim");
const { protect } = require("../middlewares/auth");

router.route("/brands").get(getCarBrands).post(getCarBrandsDynamic);
router.route("/filter/get-min-max").get(getTrimMinMaxFilterPrice).post(getTrimMinMaxFilterPriceDynamic);
router.route("/filter/power/get-min-max").get(getTrimMinMaxFilterPower).post(getTrimMinMaxFilterPowerDynamic);
router.route("/filter/torque/get-min-max").get(getTrimMinMaxFilterTorque).post(getTrimMinMaxFilterTorqueDynamic);
router.route("/filter/displacement/get-min-max").get(getTrimMinMaxFilterDisplacement).post(getTrimMinMaxFilterDisplacementDynamic);
router.route("/search/:keyword").get(mainSearch);
router.route("/contact-form").post(contactFormSubmit)
router.route("/subscribe").post(subscriptionFormSubmit)

module.exports = router;
