const asyncHandler = require("../middlewares/asyncHandler");
const Admin = require("../models/Admin");
const ErrorResponse = require("../util/errorResponse");
const AWS = require('../util/aws');
const { sign } = require("../util/jwt");

const singleUpload = AWS.upload.single('image')

module.exports.loginAdmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body.admin;

  fieldValidation(email, next);
  fieldValidation(password, next);

  const admin = await Admin.findOne({
    where: {
      email: email,
    },
  });

  if (!admin) {
    return next(new ErrorResponse(`Admin not found`, 404));
  }

  const isMatch = admin.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Wrong password", 401));
  }

  delete admin.dataValues.password;

  admin.dataValues.token = await sign(admin);

  admin.dataValues.bio = null;
  admin.dataValues.image = null;

  res.status(200).json({ admin });
});

module.exports.getCurrentAdmin = asyncHandler(async (req, res, next) => {
  const { loggedAdmin } = req;
  const admin = await Admin.findByPk(loggedAdmin.id);

  if (!admin) {
    return next(new ErrorResponse(`Admin not found`, 404));
  }

  admin.dataValues.token = req.headers.authorization.split(" ")[1];

  res.status(200).json({ admin });
});

module.exports.uploadFile = asyncHandler(async (req, res, next) => {

  singleUpload(req, res, (err) => {
    if (err) {
      throw(err)
      return res.status(422).json({ errors: [{ title: 'File Upload Error', detail: err.message }] });
    }
      return res.json({ url: req.file.location, path: req.file.key, status: 'done' });
    
  })
});

module.exports.updateAdmin = asyncHandler(async (req, res, next) => {
  await Admin.update(req.body.admin, {
    where: {
      id: req.admin.id,
    },
  });

  const admin = await Admin.findByPk(req.admin.id);
  admin.dataValues.token = req.headers.authorization.split(" ")[1];

  res.status(200).json({ admin });
});

const fieldValidation = (field, next) => {
  if (!field) {
    return next(new ErrorResponse(`Missing fields`, 400));
  }
};