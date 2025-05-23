const Sequelize = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE_NAME,
  process.env.MYSQL_USERNAME,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    port: process.env.MYSQL_PORT,
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log('MySQL database connected!');
  })
  .catch((err) => {
    console.error('MySQL connection error:', err);
  });

module.exports = sequelize;
