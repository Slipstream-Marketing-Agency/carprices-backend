const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const CarBrandPopularModels = sequelize.define("car_brand_popular_models", {
  brandId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  modelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = CarBrandPopularModels;
