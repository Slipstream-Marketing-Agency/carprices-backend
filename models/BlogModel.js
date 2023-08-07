const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const BlogModel = sequelize.define("blog_model", {
    blogId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    modelId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

module.exports = BlogModel;
