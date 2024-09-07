import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../db";
import { Square } from "./Square";

interface Card extends Model<InferAttributes<Card>, InferCreationAttributes<Card>> {
    id: ForeignKey<Square['id']>;
    title: string;
    description: string;
    money: CreationOptional<number>;
    houseMultiplier: CreationOptional<number>;
    hotelMultiplier: CreationOptional<number>;
    squareAbsolute: CreationOptional<number>;
    squareRelative: CreationOptional<number>
    othersInvolved: CreationOptional<boolean>;
    givesJailCard: CreationOptional<boolean>;
}

const Card = sequelize.define<Card>('Cards', {
    id: {
        type: DataTypes.TINYINT,
        references: {
            model: Square,
            key: 'id'
        },
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    money: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0
    },
    houseMultiplier: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        defaultValue: null
    },
    hotelMultiplier: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        defaultValue: null
    },
    squareAbsolute: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: null
    },
    squareRelative: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0
    },
    othersInvolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    givesJailCard: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, { timestamps: false });

export { Card };