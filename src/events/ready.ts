import { Events } from "discord.js";
import Event from "../models/classes/Event";
import { User } from "../db/tables/User";
import { Game } from "../db/tables/Game";
import { sequelize } from "../db/db";
import { Player } from "../db/tables/Player";

const event = new Event(Events.ClientReady, true, (client) => {
    setupDatabase();

    console.log(`Connected. Logged in as ${client.user!.tag}`);
});

function setupDatabase() {
    sequelize.sync({ force: true });
    
    setupDatabaseAssociations();
}

function setupDatabaseAssociations() {
    User.belongsToMany(Game, { through: Player });
    Game.belongsToMany(User, { through: Player });
}

export { event };