const { verify } = require("../util/jwt");
const Admin = require("../models/Admin");
const ErrorResponse = require("../util/errorResponse");

exports.protect = async (req, res, next) => {
  try {
    const { headers } = req;
    if (!headers.authorization) throw new SyntaxError("Token missing or malformed"); 
    // console.log("Checkinggggg ");

    const token = headers.authorization.split(" ")[1];
    if (!token) throw new SyntaxError("Token missing or malformed");

    const adminVerified = await verify(token);
    if (!adminVerified) throw new Error("Invalid Token");

    req.loggedAdmin = await Admin.findOne({
      attributes: { exclude: ["email", "password"] },
      where: { email: adminVerified.email },
    });

    if (!req.loggedAdmin) next(new NotFoundError("Admin"));

    headers.email = adminVerified.email;
    req.loggedAdmin.dataValues.token = token;

    next();
  } catch (error) {
    console.log("Errrr ",error);
    next(error);
  }
};
