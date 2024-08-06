import { DataTypes } from "sequelize";
import { sequelize } from "../db";
import { Game } from "./Game";
import { User } from "./User";

const Player = sequelize.define('players', {
    gameId: {
        type: DataTypes.INTEGER,
        references: {
            model: Game,
            key: 'id'
        },
        primaryKey: true
    },
    userId: {
        type: DataTypes.STRING,
        references: {
            model: User,
            key: 'id'
        },
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