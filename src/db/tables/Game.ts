import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	NonAttribute,
} from 'sequelize';
import { sequelize } from '../db';
import { Player } from './Player';

interface Game extends Model<InferAttributes<Game>, InferCreationAttributes<Game>> {
	id: CreationOptional<number>;
	guild_id: string;
	start_date: CreationOptional<Date>;
	status: CreationOptional<'new' | 'active' | 'finished'>;
	currentTurn: CreationOptional<number>;
	players?: NonAttribute<Player[]>;
}

const Game = sequelize.define<Game>(
	'games',
	{
		id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER },
		guild_id: { type: DataTypes.STRING, allowNull: false },
		start_date: { type: DataTypes.DATE },
		status: {
			type: DataTypes.STRING,
			validate: { isIn: [['new', 'active', 'finished']] },
			defaultValue: 'new',
		},
		currentTurn: { type: DataTypes.TINYINT },
	},
	{ timestamps: false },
);

export { Game };
