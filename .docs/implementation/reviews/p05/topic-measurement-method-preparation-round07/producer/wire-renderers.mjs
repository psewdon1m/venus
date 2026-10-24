import { randomUUID } from 'node:crypto';
import { revision } from '../../apps/api/dist/rooms.js';
export function makeWireRenderers(rooms) {
    function send(socket, grant, view) {
        if (socket.readyState !== 1)
            return;
        socket.send(JSON.stringify({ schema: 1, event_id: randomUUID(), room_id: grant.roomId, room_rev: revision(view.room_rev), stream: 'room', stream_rev: revision(view.room_rev), type: 'room.snapshot', server_time: new Date(rooms.now()).toISOString(), audience: 'room', payload: view }));
    }
    async function sendGame(socket, grant, bundle, publicSnapshot) {
        if (socket.readyState !== 1)
            return;
        const common = { schema: 1, room_id: grant.roomId, room_rev: bundle.room.room_rev, server_time: new Date(rooms.now()).toISOString() };
        if (publicSnapshot)
            await rooms.dispatchGame(grant, (game, roomRev) => { if (socket.readyState === 1)
                socket.send(JSON.stringify({ ...common, room_rev: roomRev, server_time: new Date(rooms.now()).toISOString(), event_id: randomUUID(), stream: 'game', stream_rev: roomRev, type: 'game.snapshot', audience: 'room', payload: game })); });
        for (const ref of bundle.privateEvents)
            await rooms.dispatchPrivate(grant, ref.eventId, (event, roomRev) => { if (socket.readyState === 1)
                socket.send(JSON.stringify({ ...common, room_rev: roomRev, server_time: new Date(rooms.now()).toISOString(), event_id: event.eventId, stream: 'private', stream_rev: event.revision, type: event.type, audience: 'member', target_member_id: grant.memberId, payload: event.payload })); });
    }
    return { send, sendGame };
}
