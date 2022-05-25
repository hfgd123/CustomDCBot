const {randomElementFromArray, embedType} = require('../../../src/functions/helpers');
const {localize} = require('../../../src/functions/localize');
module.exports.run = async function (client, oldGuildMember, newGuildMember) {
    const moduleConfig = client.configurations['welcomer']['config'];

    if (!client.botReadyAt) return;
    if (oldGuildMember.pending && !newGuildMember.pending) {
        await newGuildMember.roles.add(moduleConfig['give-roles-on-join']);
    }

    if (newGuildMember.guild.id !== client.guild.id) return;

    if (!oldGuildMember.premiumSince && newGuildMember.premiumSince) {
        await sendBoostMessage('boost');
    }

    if (oldGuildMember.premiumSince && !newGuildMember.premiumSince) {
        await sendBoostMessage('unboost');
    }

    /**
     * Sends the boost message
     * @private
     * @param {String} type Type of the boost
     * @return {Promise<void>}
     */
    async function sendBoostMessage(type) {
        const moduleChannels = client.configurations['welcomer']['channels'];

        for (const channelConfig of moduleChannels.filter(c => c.type === type)) {
            const channel = await guildMember.guild.channels.fetch(channelConfig.channelID).catch(() => {
            });
            if (!channel) {
                client.logger.error(localize('welcomer', 'channel-not-found', {c: channelConfig.channelID}));
                continue;
            }
            let message;
            if (channelConfig.randomMessages) {
                message = (randomElementFromArray(client.configurations['welcomer']['random-messages'].filter(m => m.type === type)) || {}).message;
            }
            if (!message) message = channelConfig.message;

            await channel.send(embedType(message || 'Message not found',
                {
                    '%mention%': newGuildMember.toString(),
                    '%memberProfilePictureUrl%': newGuildMember.user.avatarURL(),
                    '%guildLevel%': client.guild.premiumTier,
                    '%boostCount%%': client.guild.premiumSubscriptionCount
                }
            ));

            if (moduleConfig['give-roles-on-boost'].length !== 0) {
                if (type === 'boost') newGuildMember.roles.add(moduleConfig['give-roles-on-boost']);
                else newGuildMember.roles.remove(moduleConfig['give-roles-on-boost']);
            }
        }
    }
};