const express = require("express");
const { createWebstory,getAdminWebStories, updateWebstory, getAdminWebstoryById } = require("../../controllers/webstory");
const router = express.Router();
const { protect } = require("../../middlewares/auth");

router.route("/").get(protect, getAdminWebStories).post(protect, createWebstory);
router.route("/by-id/:id").get(protect, getAdminWebstoryById).put(protect, updateWebstory);

module.exports = router;
