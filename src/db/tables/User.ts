import { BelongsToManyAddAssociationMixin, CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../db";
import { Game } from "./Game";

interface User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    id: CreationOptional<string>;
    addGame: BelongsToManyAddAssociationMixin<typeof Game, number>;
}

const User = sequelize.define<User>('users', {
    id: {
        type: DataTypes.STRING(20),
        primaryKey: true
    }
}, { timestamps: false });

export { User }