import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../db";
import { Game } from "./Game";

interface Turn extends Model<InferAttributes<Turn>, InferCreationAttributes<Turn>> {
    playerOrder: CreationOptional<number>;
    gameId: number;
    userId: string; 
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
    }
}, { timestamps: false });

export { Turn }