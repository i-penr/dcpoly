import {
	CreationOptional,
	DataTypes,
	ForeignKey,
	InferAttributes,
	InferCreationAttributes,
	Model,
	NonAttribute,
} from 'sequelize';
import { sequelize } from '../db';
import { Game } from './Game';
import { Player } from './Player';
import { User } from './User';

interface PropertyGame
	extends Model<InferAttributes<PropertyGame>, InferCreationAttributes<PropertyGame>> {
	id: number;
	gameId: ForeignKey<Game['id']>;
	ownerId: ForeignKey<User['id']>;
	numBuildings: CreationOptional<0 | 1 | 2 | 3 | 4 | 5>;
	owner?: NonAttribute<Player>;
	mortgaged: CreationOptional<boolean>;
}

const PropertyGame = sequelize.define<PropertyGame>(
	'properties',
	{
		id: { type: DataTypes.TINYINT, primaryKey: true },
		gameId: {
			type: DataTypes.INTEGER,
			references: { model: Game, key: 'id' },
			allowNull: false,
			primaryKey: true,
		},
		ownerId: { type: DataTypes.STRING(20), references: { model: User, key: 'id' } },
		numBuildings: { type: DataTypes.TINYINT, defaultValue: 0, allowNull: false },
		mortgaged: { type: DataTypes.BOOLEAN, defaultValue: false },
	},
	{ timestamps: false },
);

export { PropertyGame };
