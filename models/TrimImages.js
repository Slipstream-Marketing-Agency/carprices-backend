const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const TrimImages = sequelize.define("trim_images", {
  trimId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = TrimImages;
