const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const Tag = sequelize.define("tag", {
    title: {
        type: DataTypes.STRING(75),
        allowNull: false
    },
    metaTitle: {
        type: DataTypes.STRING(100)
    },
    slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
});

module.exports = Tag;
