import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../db";
import { Game } from "./Game";
import { User } from "./User";

interface Player extends Model<InferAttributes<Player>, InferCreationAttributes<Player>> {
    gameId: ForeignKey<Game['id']>;
    userId: ForeignKey<User['id']>;
    current_square: CreationOptional<number>;
    money: CreationOptional<number>;
    jailStatus: CreationOptional<-1 | 0 | 1 | 2 | 3>; // -1, not in jail; 0,1,2,3 turns in jail
    jailFreeCards: CreationOptional<number>;
    doubleRollStreak: CreationOptional<number>;
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
    jailStatus: {
        type: DataTypes.TINYINT,
        defaultValue: -1,
        allowNull: false
    },
    jailFreeCards: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        allowNull: false
    },
    doubleRollStreak: {
        type: DataTypes.SMALLINT,
        defaultValue: 0,
        allowNull: false
    }
}, { timestamps: false });

export { Player };