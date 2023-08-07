const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const BlogBrand = sequelize.define("blog_brand", {
    blogId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    brandId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

module.exports = BlogBrand;
