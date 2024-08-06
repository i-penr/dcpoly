import { DataTypes } from "sequelize";
import { sequelize } from "../db";

const User = sequelize.define('users', {
    id: {
        type: DataTypes.STRING(20),
        primaryKey: true
    }
}, { timestamps: false });

export { User }