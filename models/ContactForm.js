const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const ContactForm = sequelize.define("contact_form", {
  name: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  mobile: {
    type: DataTypes.STRING,
  },
  subject: {
    type: DataTypes.STRING,
  },
  message: {
    type: DataTypes.TEXT,
  },
});

module.exports = ContactForm;
