const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const Newsletter = sequelize.define("newsletter", {
  email: {
    type: DataTypes.STRING,
    unique: true
  }
});

module.exports = Newsletter;
