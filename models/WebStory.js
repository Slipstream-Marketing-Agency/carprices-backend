const { DataTypes } = require("sequelize");
const sequelize = require("../util/database");

const Slide = sequelize.define("slide", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image1: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image2: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subtitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  theme: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});


const WebStory = sequelize.define("web_story", {
  mainTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  storyType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  metaTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  metaDescription: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  storyLanguage: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  published: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  publishedAt: {
    type: DataTypes.DATE,
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  urlName: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

WebStory.hasMany(Slide, { onDelete: "CASCADE" });
Slide.belongsTo(WebStory);

module.exports = { WebStory, Slide };
