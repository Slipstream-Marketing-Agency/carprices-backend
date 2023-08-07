const express = require("express");
const { getAdminBlogs, createBlog, createBlogCategory, getAdminBlogCategory, updateBlogCategory, getAdminBlogById, getAdminBlogTags, updateBlog } = require("../../controllers/blog");
const router = express.Router();
const { protect } = require("../../middlewares/auth");

router.route("/").get(protect, getAdminBlogs).post(protect, createBlog);
router.route("/by-id/:id").get(protect, getAdminBlogById).put(protect, updateBlog)
router.route("/category").get(protect, getAdminBlogCategory).post(protect, createBlogCategory);
router.route("/category/:category").post(protect, updateBlogCategory);
router.route("/tags").get(protect, getAdminBlogTags);

module.exports = router;
