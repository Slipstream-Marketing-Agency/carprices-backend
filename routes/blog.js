const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const { getAdminBlogs, getBlogs, getBlogBySlug, getBlogsByModel, getBlogsByBrand, getBlogsMin, getBlogsByTag, getBlogsByTags, getBlogsTag, getBlogsByTagsWithSlug } = require("../controllers/blog");

router.route("/").get(getBlogs)
router.route("/min").get(getBlogsMin)
router.route("/tags/list").get(getBlogsTag)
router.route("/:slug").get(getBlogBySlug)
router.route("/by-model/:model").get(getBlogsByModel)
router.route("/by-brand/:brand").get(getBlogsByBrand)
router.route("/by-tag/:tag").get(getBlogsByTag)
router.route("/by-tags").post(getBlogsByTags)
router.route("/by-tags/slug").post(getBlogsByTagsWithSlug)




module.exports = router;
