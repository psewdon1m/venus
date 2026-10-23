import { requireThat } from 'file:///C:/.projects/venus/apps/api/dist/security.js';
import { enqueueFencedJson } from 'file:///C:/.projects/venus/apps/api/dist/http-delivery.js';
/** Registration is explicit; server.ts never installs this by importing it. */
export function registerTopicGameRoutes(app, games, guard) {
    const base = '/api/v2/rooms/:roomId/game';
    const room = (r) => guard.roomId(r);
    function id(r, key) { const value = r.params[key]; requireThat(typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value), 'INVALID_REQUEST', 400); return value; }
    async function read(r) { requireThat(!r.url.includes('?'), 'INVALID_REQUEST', 400); return guard.privateReadGuard(r); }
    async function mutate(r) { requireThat(!r.url.includes('?'), 'INVALID_REQUEST', 400); guard.origin(r); return guard.memberGuard(r); }
    async function receipt(r, p, result) { await games.dispatchReceipt(room(r), guard.credential(r), result, value => enqueueFencedJson(p, value)); return p; }
    app.get(base + '/current', async (r, p) => { await read(r); await games.dispatchHttpView(room(r), guard.credential(r), v => enqueueFencedJson(p, v)); return p; });
    app.get(base + '/availability', async (r) => games.availability(room(r), await read(r)));
    app.get(base + '/self-actions', async (r, p) => { await games.dispatchSelfActions(room(r), await read(r), v => enqueueFencedJson(p, v)); return p; });
    app.post(base + '/prepare', async (r, p) => receipt(r, p, await games.prepare(room(r), await mutate(r), r.body)));
    app.post(base + '/start', async (r, p) => receipt(r, p, await games.start(room(r), await mutate(r), r.body)));
    app.post(base + '/:sessionId/round/advance', async (r, p) => receipt(r, p, await games.advance(room(r), await mutate(r), id(r, 'sessionId'), r.body)));
    app.post(base + '/:sessionId/resume', async (r, p) => receipt(r, p, await games.resume(room(r), await mutate(r), id(r, 'sessionId'), r.body)));
    for (const method of ['stop', 'pause', 'abort'])
        app.post(base + '/:sessionId/' + method, async (r, p) => receipt(r, p, await games.safetyStop(room(r), await mutate(r), id(r, 'sessionId'), r.body, method)));
    const round = base + '/:sessionId/round/:roundId';
    app.get(round + '/target', async (r, p) => { await games.roundTarget(room(r), await read(r), id(r, 'sessionId'), id(r, 'roundId'), v => enqueueFencedJson(p, v)); return p; });
    app.post(round + '/response', async (r, p) => receipt(r, p, await games.response(room(r), await mutate(r), id(r, 'sessionId'), id(r, 'roundId'), r.body)));
    app.post(round + '/choice', async (r, p) => receipt(r, p, await games.choice(room(r), await mutate(r), id(r, 'sessionId'), id(r, 'roundId'), r.body)));
    app.post(round + '/condition', async (r, p) => receipt(r, p, await games.condition(room(r), await mutate(r), id(r, 'sessionId'), id(r, 'roundId'), r.body)));
    app.post(round + '/finish', async (r, p) => receipt(r, p, await games.finish(room(r), await mutate(r), id(r, 'sessionId'), id(r, 'roundId'), r.body)));
    app.get(round + '/conversation', async (r, p) => { await games.dispatchConversation(room(r), await read(r), id(r, 'sessionId'), id(r, 'roundId'), v => enqueueFencedJson(p, v)); return p; });
    app.post(round + '/conversation/commands', { bodyLimit: 8192 }, async (r, p) => receipt(r, p, await games.conversationCommand(room(r), await mutate(r), id(r, 'sessionId'), id(r, 'roundId'), r.body)));
    app.post(round + '/conversation/chat', { bodyLimit: 8192 }, async (r, p) => { const result = await games.sendChat(room(r), await mutate(r), id(r, 'sessionId'), id(r, 'roundId'), r.body); await games.dispatchChatReceipt(room(r), guard.credential(r), id(r, 'sessionId'), id(r, 'roundId'), result, value => enqueueFencedJson(p, value)); return p; });
    app.get(round + '/conversation/chat', async (r, p) => { await games.dispatchChat(room(r), await read(r), id(r, 'sessionId'), id(r, 'roundId'), v => enqueueFencedJson(p, v)); return p; });
}
