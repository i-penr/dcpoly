import { DataTypes } from "sequelize";
import { sequelize } from "../db";

const Game = sequelize.define('games', {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    },
    guild_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    start_date: {
        type: DataTypes.DATE
    },
    status: {
        type: DataTypes.STRING,
        validate: {
            isIn: [['new', 'active', 'finished']]
        },
        defaultValue: 'active'
    }
});

export { Game };