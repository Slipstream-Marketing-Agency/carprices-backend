const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const BlogCategory = sequelize.define("blog_category", {
    blogId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

module.exports = BlogCategory;
