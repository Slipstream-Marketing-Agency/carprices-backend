const express = require("express");
const { getWebStories } = require("../controllers/webstory");
const router = express.Router();
const { protect } = require("../middlewares/auth");

router.route("/").get(getWebStories)



module.exports = router;