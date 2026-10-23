import { requireThat } from './security.mjs';
import { unavailableTopicContent } from './topic-content-availability.mjs';
export class RoomGames {
    legacy;
    topics;
    constructor(legacy, topics) {
        this.legacy = legacy;
        this.topics = topics;
    }
    async implementation(c, roomId) {
        const row = (await c.query('SELECT private_protocol FROM rooms WHERE id=$1', [roomId])).rows[0];
        requireThat(row, 'NOT_FOUND', 404);
        requireThat(row.private_protocol === 1 || row.private_protocol === 2, 'PRIVATE_PROTOCOL_UNSUPPORTED', 503);
        if (row.private_protocol === 1)
            return this.legacy;
        requireThat(this.topics, 'PRIVATE_PROTOCOL_UNAVAILABLE', 503);
        return this.topics;
    }
    async featureAvailable(c, roomId) { return (await this.implementation(c, roomId)).featureAvailable(c, roomId); }
    async publicDelivery(c, roomId, locale) { const selected = await this.implementation(c, roomId); try {
        return await selected.publicDelivery(c, roomId, locale);
    }
    catch (error) {
        if (selected === this.topics && unavailableTopicContent(error))
            return null;
        throw error;
    } }
    async locked(c, roomId) { return (await this.implementation(c, roomId)).locked(c, roomId); }
    async memberStateChanged(c, roomId) { return (await this.implementation(c, roomId)).memberStateChanged(c, roomId); }
    async removing(c, roomId, memberId) { return (await this.implementation(c, roomId)).removing(c, roomId, memberId); }
    async setupCleared(c, roomId, memberId) { return (await this.implementation(c, roomId)).setupCleared(c, roomId, memberId); }
    async purge(c, roomId) { return (await this.implementation(c, roomId)).purge(c, roomId); }
    async socketView(c, roomId, memberId, locale, after) { const selected = await this.implementation(c, roomId); try {
        return await selected.socketView(c, roomId, memberId, locale, after);
    }
    catch (error) {
        if (selected === this.topics && unavailableTopicContent(error))
            return { game: null, privateEvents: [] };
        throw error;
    } }
    async privateDelivery(c, roomId, memberId, locale, eventId) { const selected = await this.implementation(c, roomId); try {
        return await selected.privateDelivery(c, roomId, memberId, locale, eventId);
    }
    catch (error) {
        if (selected === this.topics && unavailableTopicContent(error))
            return null;
        throw error;
    } }
}
