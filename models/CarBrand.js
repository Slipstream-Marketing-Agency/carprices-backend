const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const CarBrand = sequelize.define("car_brand", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  coverImage: {
    type: DataTypes.STRING
  }
});

module.exports = CarBrand;
