const express = require("express");
const router = express.Router();
const {
  loginAdmin,
  getCurrentAdmin,
  updateAdmin,
  uploadFile,
} = require("../../controllers/admin");
const { protect } = require("../../middlewares/auth");

router.post("/admin/login", loginAdmin);

router.route("/admin").get(protect, getCurrentAdmin).put(protect, updateAdmin);
router.route("/admin/upload").post(protect, uploadFile);

module.exports = router;