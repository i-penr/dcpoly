import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../db";
import { Game } from "./Game";
import { User } from "./User";

interface Player extends Model<InferAttributes<Player>, InferCreationAttributes<Player>> {
    gameId: ForeignKey<Game['id']>;
    userId: ForeignKey<User['id']>;
    current_square: CreationOptional<number>;
    money: CreationOptional<number>;
    isJailed: CreationOptional<boolean>;
}


const Player = sequelize.define<Player>('players', {
    gameId: {
        type: DataTypes.INTEGER,
        references: {
            model: Game,
            key: 'id'
        },
        primaryKey: true
    },
    userId: {
        type: DataTypes.STRING(20),
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
    },
    isJailed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
}, { timestamps: false });

export { Player };