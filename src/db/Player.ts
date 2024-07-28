import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "./db";

const Player = sequelize.define('player', {
    username: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    current_square: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: false
    },
    money: {
        type: DataTypes.INTEGER,
        defaultValue: 1500,
        allowNull: false
    }
});

export { Player };