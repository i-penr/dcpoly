import { Events } from "discord.js";
import Event from "../models/classes/Event";
import { User } from "../db/tables/User";
import { Game } from "../db/tables/Game";
import { sequelize } from "../db/db";
import { Player } from "../db/tables/Player";
import { Turn } from "../db/tables/Turn";

const event = new Event(Events.ClientReady, true, (client) => {
    setupDatabase();

    console.log(`Connected. Logged in as ${client.user!.tag}`);
});

function setupDatabase() {
    sequelize.sync({ force: true });
    
    setupDatabaseAssociations();
}

function setupDatabaseAssociations() {
    User.hasMany(Player, {
        foreignKey: {
            allowNull: false
        }
    });
    Player.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' });

    Game.hasMany(Player, {
        foreignKey: {
            allowNull: false
        }
    })
    Player.belongsTo(Game, { foreignKey: 'gameId', targetKey: 'id' });

    Game.hasOne(Turn);
    Turn.belongsTo(Game);

    Player.hasOne(Turn, {
        foreignKey: 'userId'
    });
    Turn.belongsTo(Player, {
        foreignKey: 'userId'
    });
}

export { event };