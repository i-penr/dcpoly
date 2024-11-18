import Client from "../../models/classes/Client";
import { Property } from "../../db/tables/Property";
import { Square } from "../../db/tables/Square";
import { buildTemplateEmbed } from "./buildTemplateEmbed";

export const buildPropertyEmbed = async (property: Property, square: Square) => {
    return buildTemplateEmbed()
    .setColor(property.color)
    .setTitle(square.name)
    .setDescription(`- **Price**: \`${property.price}\`$\n- **Base rent**: \`${square.rent}\`$\n- **Owned by**: ${property.owner ? await Client.getInstance().users.fetch(property.owner): 'Nobody'}`)
    .addFields([
        { name: 'Rent with 1 building', value: 'PLACEHOLDER', inline: true },
        { name: 'Rent with 2 buildings', value: 'PLACEHOLDER', inline: true },
        { name: 'Rent with 3 buildings', value: 'PLACEHOLDER', inline: true },
        { name: 'Rent with 4 buildings', value: 'PLACEHOLDER', inline: true },
        { name: 'Rent with 1 hotel', value: 'PLACEHOLDER', inline: true },
    ]);
}