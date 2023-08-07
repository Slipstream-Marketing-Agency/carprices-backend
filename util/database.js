const { Sequelize } = require("sequelize");
require('dotenv').config()

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  dialect: "postgres",
  host: process.env.DB_HOST//"127.0.0.1",
});

const checkConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`DB Connected`.cyan.underline.bold);
  } catch (error) {
    console.error("Unable to connect to the database:".red.bold, error);
  }
};

checkConnection();

module.exports = sequelize;
