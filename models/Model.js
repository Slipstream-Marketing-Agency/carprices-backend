const { DataTypes } = require("sequelize");
const sequelize = require("../util/database");

const Model = sequelize.define("model", {
    name: {
        type: DataTypes.STRING(75),
        allowNull: false
    },
    metaTitle: {
        type: DataTypes.STRING(100)
    },
    slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        // unique: true
    },
    description: {
        type: DataTypes.TEXT
    },
    brand: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    isFeatured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    isElectricFeatured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    isLuxury: {
        type: DataTypes.BOOLEAN,
    },
    isPremiumLuxury: {
        type: DataTypes.BOOLEAN,
    },
    isSafety: {
        type: DataTypes.BOOLEAN,
    },
    isFuelEfficient: {
        type: DataTypes.BOOLEAN,
    },
    isOffRoad: {
        type: DataTypes.BOOLEAN,
    },
    haveMusic: {
        type: DataTypes.BOOLEAN,
    },
    haveTechnology: {
        type: DataTypes.BOOLEAN,
    },
    havePerformance: {
        type: DataTypes.BOOLEAN,
    },
    isSpacious: {
        type: DataTypes.BOOLEAN,
    },
    isElectric: {
        type: DataTypes.BOOLEAN,
    },
    highTrim: {
        type: DataTypes.INTEGER,
    },
    featuredImage: {
        type: DataTypes.STRING,
    },
    published: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    publishedAt: {
        type: DataTypes.DATE
    },
});

module.exports = Model;
