const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const TrimVideos = sequelize.define("trim_video", {
  trimId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  video: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = TrimVideos;
