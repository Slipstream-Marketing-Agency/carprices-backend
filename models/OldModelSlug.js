const { DataTypes } = require("sequelize");
const sequelize = require("../util/database");

const OldModelSlug = sequelize.define("old_model_slug", {
    model: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    oldSlug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        // unique: true
    },
});

module.exports = OldModelSlug;
