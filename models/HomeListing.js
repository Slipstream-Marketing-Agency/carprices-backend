const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const HomeListing = sequelize.define("home_listing", {
    orderNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    modelId: {
        type: DataTypes.INTEGER
    },
    modelId2: {
        type: DataTypes.INTEGER
    },
    brandId: {
        type: DataTypes.INTEGER
    },
    type: {
        type: DataTypes.ENUM,
        values: ['popular', 'featured', 'electricFeatured', 'compareCar', 'popularBrand']
    }
});

module.exports = HomeListing;
