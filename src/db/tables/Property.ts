import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "sequelize";
import { sequelize } from "../db";
import { Square } from "./Square";
import { User } from "./User";
import { Game } from "./Game";

interface Property extends Model<InferAttributes<Property>, InferCreationAttributes<Property>> {
    number: ForeignKey<Square['id']>;
    gameId: ForeignKey<Game['id']>;
    owner: ForeignKey<User['id']>;
    currentRent: CreationOptional<number>;
    color: 'red' | 'pink' | 'yellow' | 'light_blue' | 'dark_blue' | 'green' | 'brown' | 'orange';
}

const Property = sequelize.define<Property>('properties', {
    number: {
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
    currentRent: {
        type: DataTypes.SMALLINT,
        allowNull: false,
    },
    color: {
        type: DataTypes.STRING(10),
        validate: {
            isIn: [['red', 'pink', 'yellow', 'light_blue', 'dark_blue', 'green', 'brown', 'orange']]
        },
        allowNull: false
    },
}, { timestamps: false });

export { Property };