import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../db";
import { Game } from "./Game";

interface Turn extends Model<InferAttributes<Turn>, InferCreationAttributes<Turn>> {
    playerOrder: CreationOptional<number>;
    gameId: number;
    userId: string;
    hasRolled: CreationOptional<boolean>;
}

const Turn = sequelize.define<Turn>('turns', {
    playerOrder: {
        type: DataTypes.TINYINT,
        primaryKey: true
    },
    gameId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Game,
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.STRING(20)
    },
    hasRolled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, { timestamps: false });

export { Turn }