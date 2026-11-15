// API d'enregistrement des niveaux (save-level.php), sans navigateur
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, api, onlineLevels } from './helpers.mjs';

const level = (extra = {}) => ({
    lines: [{ start: { x: 0, y: 0 }, end: { x: 400, y: 400 } }, { start: { x: 400, y: 0 }, end: { x: 0, y: 400 } }],
    intersections: [{ name: '0-1', position: { x: 200, y: 200 }, lines: [0, 1] }],
    dragons: [{ name: 0, position: { x: 50, y: 50 }, lines: [0], anchor: { line: 0, prev: 'start', next: 1, u: 0.25 } }],
    start: { x: 10, y: 10, lines: [0] },
    end: { x: 390, y: 10, lines: [1] },
    ...extra,
});

describe('save-level.php', () => {
    let server;
    before(async () => { server = await startServer(); });
    after(() => server.stop());

    it('refuse un GET et un mauvais mot de passe', async () => {
        assert.equal((await fetch(server.url + 'save-level.php')).status, 405);
        const r = await fetch(server.url + 'save-level.php', { method: 'POST', body: JSON.stringify({ password: 'faux', json: level() }) });
        assert.equal(r.status, 401);
    });

    it('refuse un niveau sans départ ou avec une ligne inexistante', async () => {
        const { start, ...withoutStart } = level();
        assert.equal((await api(server.url, { json: withoutStart })).status, 422);
        assert.equal((await api(server.url, { json: level({ end: { x: 0, y: 0, lines: [7] } }) })).status, 422);
    });

    it('crée, remplace et supprime un niveau', async () => {
        const created = await api(server.url, { json: level() });
        assert.equal(created.status, 201);
        const id = created.body.id;
        let levels = await onlineLevels(server.url);
        assert.ok(levels.some(l => l.id === id));
        assert.deepEqual(levels.find(l => l.id === id).json.dragons[0].anchor, { line: 0, prev: 'start', next: 1, u: 0.25 });

        const replaced = await api(server.url, { action: 'replace', id, json: level({ start: { x: 20, y: 20, lines: [0] } }) });
        assert.equal(replaced.status, 200);
        levels = await onlineLevels(server.url);
        assert.equal(levels.find(l => l.id === id).json.start.x, 20);

        assert.equal((await api(server.url, { action: 'delete', id })).status, 200);
        assert.equal((await api(server.url, { action: 'delete', id })).status, 404);
        assert.equal((await api(server.url, { action: 'delete', id: '../x' })).status, 400);
    });

    it('conserve les portails, et l\'absence de liste de portails', async () => {
        const portals = [{ a: { x: 100, y: 100, lines: [0] }, b: { x: 200, y: 200, lines: [0, 1] }, consumable: true, oneWay: true }];
        const withPortals = await api(server.url, { json: level({ portals }) });
        const without = await api(server.url, { json: level() });
        const levels = await onlineLevels(server.url);
        assert.deepEqual(levels.find(l => l.id === withPortals.body.id).json.portals, portals);
        assert.ok(!('portals' in levels.find(l => l.id === without.body.id).json));
        assert.equal((await api(server.url, { json: level({ portals: [{ a: { x: 0, y: 0, lines: [] }, b: { x: 1, y: 1, lines: [0] } }] }) })).status, 422);
    });

    it('niveau officiel : sa modification crée une version en ligne, il ne se supprime pas', async () => {
        assert.equal((await api(server.url, { action: 'replace', id: 'niveau-1', json: level() })).status, 200);
        assert.ok((await onlineLevels(server.url)).some(l => l.id === 'niveau-1'));
        assert.equal((await api(server.url, { action: 'delete', id: 'niveau-1' })).status, 200); // supprime la version en ligne
        assert.equal((await api(server.url, { action: 'delete', id: 'niveau-1' })).status, 403); // l'officiel reste
    });
});
