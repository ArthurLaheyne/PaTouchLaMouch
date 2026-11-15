// Jeu : niveau 1, déplacements, dragons, portails
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, openGame, api } from './helpers.mjs';

describe('jeu', () => {
    let server, game;
    before(async () => {
        server = await startServer();
        game = await openGame(server.url);
    });
    after(async () => {
        await game.close();
        server.stop();
    });

    it('« Click to Start » lance le niveau 1', async () => {
        await game.click(400, 450);
        await game.page.waitForFunction(() => {
            const s = game.scene.getScene('Niveau');
            return s.sys.isActive() && s.player && s.player.body;
        }, null, { timeout: 15000 });
        const info = await game.page.evaluate(() => {
            const s = game.scene.getScene('Niveau');
            const count = name => s.objects.filter(o => o.constructor.name === name).length;
            return { id: s.level_id, backTo: s.backTo, lines: s.lines.length, intersections: count('Intersection'),
                dragons: s.dragons.length, portals: count('Teleporteur'), player: [s.player.x, s.player.y], playerLines: s.player.lines.length };
        });
        assert.deepEqual(info, { id: 'niveau-1', backTo: 'MainMenu', lines: 11, intersections: 12, dragons: 10, portals: 10, player: [300, 300], playerLines: 4 });
    });

    it('va jusqu\'à une intersection', async () => {
        await game.startScene('Niveau', { level_id: 'niveau-1' });
        const state = await game.play([300, 120]);
        assert.deepEqual([state.x, state.y, state.gameOver], [300, 120, false]);
    });

    it('meurt sur un dragon, puis ne peut plus bouger', async () => {
        await game.startScene('Niveau', { level_id: 'niveau-1' });
        let state = await game.play('arrivee'); // dragon en (450, 300) sur le chemin
        assert.deepEqual([state.x, state.y, state.gameOver], [450, 300, true]);
        state = await game.play([300, 120]);
        assert.deepEqual([state.x, state.y], [450, 300]);
    });

    it('un portail à usage unique téléporte puis disparaît avec son partenaire', async () => {
        await game.startScene('Niveau', { level_id: 'niveau-1' });
        const state = await game.play([300, 0]); // haut du fil 1
        assert.deepEqual([state.x, state.y, state.portals], [300, 600, 8]);
    });

    it('ne dépasse pas sa cible quand le jeu rame (collisions à chaque pas physique)', async () => {
        await game.startScene('Niveau', { level_id: 'niveau-1' });
        await game.page.evaluate(() => {
            const s = game.scene.getScene('Niveau');
            window.slow = () => { const t = performance.now(); while (performance.now() - t < 150) {} };
            s.events.on('postupdate', window.slow);
            s.player.body.reset(300, 297.5); // trajet qui n'est pas un multiple du pas physique
        });
        const state = await game.play([300, 120]);
        await game.page.evaluate(() => game.scene.getScene('Niveau').events.off('postupdate', window.slow));
        assert.deepEqual([state.x, state.y], [300, 120]);
    });

    describe('portails explicites', () => {
        // 3 fils ; le portail b remplace l'intersection (500, 450) entre H2 et V
        const level = (pair, start = { x: 150, y: 150, lines: [0] }) => ({
            lines: [{ start: { x: 100, y: 150 }, end: { x: 700, y: 150 } }, { start: { x: 100, y: 450 }, end: { x: 700, y: 450 } },
                { start: { x: 500, y: 350 }, end: { x: 500, y: 560 } }],
            intersections: [{ name: '1-2', position: { x: 500, y: 450 }, lines: [1, 2] }],
            dragons: [{ name: 0, position: { x: 200, y: 450 }, lines: [1] }],
            start, end: { x: 500, y: 540, lines: [2] },
            ...(pair ? { portals: [{ a: { x: 650, y: 150, lines: [0] }, b: { x: 500, y: 450, lines: [1] }, consumable: false, oneWay: false, ...pair }] } : {}),
        });
        const create = async (json) => (await api(server.url, { json })).body.id;
        const intersection = () => game.page.evaluate(() => {
            const i = game.scene.getScene('Niveau').intersections[0];
            return { visible: i.visible, clickable: !!(i.input && i.input.enabled) };
        });

        it('paire permanente : aller-retour, sortie sur le carrefour, victoire', async () => {
            await game.startScene('Niveau', { level_id: await create(level({})) });
            assert.deepEqual(await intersection(), { visible: false, clickable: false });
            let state = await game.play('portal0-a');
            assert.deepEqual([state.x, state.y, state.lines], [500, 450, ['line1', 'line2']]);
            state = await game.play('portal0-b'); // on est dessus : il s'active
            assert.deepEqual([state.x, state.y], [650, 150]);
            await game.play('portal0-a');
            state = await game.play('arrivee');
            assert.equal(state.gameOver, true);
        });

        it('usage unique : les portails disparaissent, l\'intersection réapparaît', async () => {
            await game.startScene('Niveau', { level_id: await create(level({ consumable: true })) });
            const state = await game.play('portal0-a');
            assert.deepEqual([state.x, state.y, state.portals], [500, 450, 0]);
            assert.deepEqual(await intersection(), { visible: true, clickable: true });
        });

        it('sens unique : la sortie ne renvoie pas', async () => {
            await game.startScene('Niveau', { level_id: await create(level({ oneWay: true })) });
            await game.play('portal0-a');
            const state = await game.play('portal0-b');
            assert.deepEqual([state.x, state.y], [500, 450]);
        });

        it('le portail remplaçant une intersection est atteignable depuis ses deux fils', async () => {
            await game.startScene('Niveau', { level_id: await create(level({}, { x: 500, y: 380, lines: [2] })) });
            const state = await game.play('portal0-b');
            assert.deepEqual([state.x, state.y], [650, 150]);
        });

        it('ancien niveau sans liste : un portail à chaque bout de chaque fil', async () => {
            await game.startScene('Niveau', { level_id: await create(level(null)) });
            assert.equal((await game.playState()).portals, 6);
        });
    });

    it('aucune erreur JavaScript', () => {
        assert.deepEqual(game.errors, []);
    });
});
