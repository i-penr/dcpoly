import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../db";

interface Square extends Model<InferAttributes<Square>, InferCreationAttributes<Square>> {
    id: number;
    rent: number;
    name: string;
    type: 'property' | 'station' | 'card' | 'special' | 'start' | 'jail' | 'visit_jail' | 'free_space' | 'small_tax' | 'big_tax';
}


const Square = sequelize.define<Square>('squares', {
   id: {
    type: DataTypes.TINYINT,
    primaryKey: true
   },
   rent: {
    type: DataTypes.SMALLINT,
    allowNull: false
   },
   name: {
    type: DataTypes.STRING(20)
   },
   type: {
    type: DataTypes.STRING(20)
   }
}, { timestamps: false });

export { Square };