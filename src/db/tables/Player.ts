import { DataTypes } from "sequelize";
import { sequelize } from "../db";
import { Game } from "./Game";
import { User } from "./User";

const Players = sequelize.define('players', {
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
    start_date: {
        type: DataTypes.DATE
    }
});

export { Players };