const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const Blog = sequelize.define("blog", {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    metaTitle: {
        type: DataTypes.STRING
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    type: {
        type: DataTypes.STRING,
        // values: ["review","news"],
        defaultValue: "news"
    },
    summary: {
        type: DataTypes.TEXT
    },
    published: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    publishedAt: {
        type: DataTypes.DATE
    },
    content: {
        type: DataTypes.TEXT
    },
    coverImage: {
        type: DataTypes.STRING
    },
    author: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
});

module.exports = Blog;
