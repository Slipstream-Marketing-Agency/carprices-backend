const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const BlogTag = sequelize.define("blog_tag", {
    blogId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    tagId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

module.exports = BlogTag;
