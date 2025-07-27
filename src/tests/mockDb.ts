import { sequelize as baseSequelize } from "../db/db";
import { setupDatabaseAssociations } from "../db/db_creation/db_creation";
import { setupFakeTestGame } from "./setupFakeTestGame";

let associationsSetUp = false;

export async function mockDb() {
    const sequelize = Object.assign(baseSequelize);
    //sequelize.options.logging = console.log;
    sequelize.options.storage = ':memory:';

    await sequelize.drop();
    await sequelize.sync({ force: true });

    if (!associationsSetUp) {
        setupDatabaseAssociations();
        associationsSetUp = true;
    }

    await setupFakeTestGame();

    return sequelize;
}
