import { DataTypes } from "sequelize";
import { sequelize } from "../db";

const User = sequelize.define('users', {
    id: {
        type: DataTypes.STRING(20),
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

export { User }