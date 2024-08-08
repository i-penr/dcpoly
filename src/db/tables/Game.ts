import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../db";

interface Game extends Model<InferAttributes<Game>, InferCreationAttributes<Game>> {
    id: CreationOptional<number>;
    guild_id: string;
    start_date: CreationOptional<Date>;
    status: CreationOptional<'new' | 'active' | 'finished'>;
}

const Game = sequelize.define<Game>('games', {
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
        defaultValue: 'new'
    }
}, { timestamps: false });

export { Game };