import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "sequelize";
import { sequelize } from "../db";
import { Square } from "./Square";
import { User } from "./User";
import { Game } from "./Game";

interface Property extends Model<InferAttributes<Property>, InferCreationAttributes<Property>> {
    id: ForeignKey<Square['id']>;
    gameId: ForeignKey<Game['id']>;
    owner: ForeignKey<User['id']>;
    price: CreationOptional<number>;
    mortgage: CreationOptional<number>;
    color: 'Red' | 'LuminousVividPink' | 'Yellow' | 'Blue' | 'DarkBlue' | 'Green' | 'DarkOrange' | 'Orange';
    square: NonAttribute<Square>;
}

const Property = sequelize.define<Property>('properties', {
    id: {
        type: DataTypes.TINYINT,
        references: {
            model: Square,
            key: 'id'
        },
        primaryKey: true
    },
    gameId: {
        type: DataTypes.INTEGER,
        references: {
            model: Game,
            key: 'id'
        },
        primaryKey: true
    },
    owner: {
        type: DataTypes.STRING(20),
        references: {
            model: User,
            key: 'id'
        },
        allowNull: true
    },
    color: {
        type: DataTypes.STRING(10),
        validate: {
            isIn: [['Red', 'LuminousVividPink', 'Yellow', 'Blue', 'DarkBlue', 'Green', 'DarkOrange', 'Orange']]
        },
        allowNull: false
    },
    price: {
        type: DataTypes.SMALLINT,
        allowNull: false
    },
    mortgage: {
        type: DataTypes.SMALLINT,
        allowNull: false
    }
}, { timestamps: false });

export { Property };