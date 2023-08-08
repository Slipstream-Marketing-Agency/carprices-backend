const express = require("express");
const { getWebStories, getWebstoryById, getWebstoryBySlug } = require("../controllers/webstory");
const router = express.Router();
const { protect } = require("../middlewares/auth");

router.route("/").get(getWebStories)
router.route("/by-slug/:slug").get(getWebstoryBySlug)
router.route("/by-id/:id").get(getWebstoryById)


module.exports = router;