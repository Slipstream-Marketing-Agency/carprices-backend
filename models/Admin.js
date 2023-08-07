const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");
const bcrypt = require("bcryptjs");

const Admin = sequelize.define(
    "admin",
    {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        firstName: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        lastName: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        image: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    { timestamps: false }
);

Model.prototype.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const DEFAULT_SALT_ROUNDS = 10;

Admin.addHook("beforeCreate", async (admin) => {
    const encryptedPassword = await bcrypt.hash(
        admin.password,
        DEFAULT_SALT_ROUNDS
    );
    admin.password = encryptedPassword;
});

module.exports = Admin;