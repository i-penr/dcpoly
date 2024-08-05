import { Sequelize } from "sequelize";

if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASS) {
    throw new Error('Database error. Missing parameters.');
}

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite'
});

export { sequelize };