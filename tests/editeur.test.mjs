// Éditeur (Sandbox) : ancrage, portails, ouverture et enregistrement de niveaux
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { startServer, openGame, api, onlineLevels } from './helpers.mjs';

const r1 = v => Math.round(v * 10) / 10;

describe('éditeur', () => {
    let server, game;
    before(async () => {
        server = await startServer();
        game = await openGame(server.url);
    });
    after(async () => {
        await game.close();
        server.stop();
    });

    const sandbox = (fn, arg) => game.page.evaluate(([fn, arg]) => new Function('s', 'arg', 'return (' + fn + ')(s, arg)')(game.scene.getScene('Sandbox'), arg), [fn.toString(), arg]);

    it('un dragon garde sa position relative sur un fil qu\'on fait pivoter', async () => {
        await game.startScene('Sandbox');
        await game.key('KeyL'); await game.click(100, 300); await game.click(500, 300);
        await game.key('KeyG'); await game.click(150, 300);
        await game.key('KeyD');
        await game.drag([[500, 300], [110, 200]], 1); // saut brusque de l'extrémité droite au-dessus de la gauche
        const circle = [[110, 200]];
        for (let i = 0; i <= 36; i++) circle.push([100 + 400 * Math.cos(i / 36 * 2 * Math.PI), 300 + 250 * Math.sin(i / 36 * 2 * Math.PI)]);
        circle.push([500, 300]);
        await game.drag(circle, 1);
        const dragon = await sandbox(s => [s.dragons[0].x, s.dragons[0].y]);
        assert.deepEqual(dragon.map(r1), [150, 300]);
    });

    it('dragons, départ et arrivée restent entre leurs bornes, sans jamais passer en rouge', async () => {
        await game.startScene('Sandbox');
        await game.key('KeyL');
        await game.click(100, 300); await game.click(500, 300); // H
        await game.click(200, 100); await game.click(200, 500); // V1
        await game.click(400, 100); await game.click(400, 500); // V2
        await game.key('KeyG'); await game.click(300, 300);
        await game.key('KeyQ'); await game.click(150, 300);
        await game.key('KeyA'); await game.click(450, 300);
        const state = () => sandbox(s => [s.dragons[0], s.depart, s.arrivee].map(o => `(${Math.round(o.x * 10) / 10},${Math.round(o.y * 10) / 10})${o.isTinted ? ' teinté' : ''}`));
        await game.key('KeyD');
        await game.drag([[400, 100], [450, 100]]); // V2 penche : son croisement avec H passe en x = 425
        assert.deepEqual(await state(), ['(312.5,300)', '(150,300)', '(462.5,300)']);
        await game.key('KeyL'); await game.click(300, 80); await game.click(300, 520); // V3 coupe le passage du dragon
        assert.deepEqual(await state(), ['(312.5,300)', '(150,300)', '(462.5,300)']); // rien ne bouge
        await game.key('KeyD');
        await game.drag([[200, 500], [200, 150]]); // V1 ne croise plus H : le dragon et le départ perdent une borne
        assert.deepEqual(await state(), ['(312.5,300)', '(150,300)', '(462.5,300)']); // ils restent en place
        await game.drag([[300, 80], [340, 80]]); // V3 penche : croise H en x = 320
        // Raccrochés à leurs nouvelles bornes : départ entre le bout de H et V3, dragon entre V3 et V2
        assert.deepEqual(await state(), ['(330.5,300)', '(155,300)', '(462.5,300)']);
    });

    it('portails : pose, options, suivi d\'une intersection, enregistrement, réouverture et jeu', async () => {
        await game.startScene('Sandbox');
        await game.key('KeyL'); await game.click(100, 300); await game.click(700, 300); await game.click(400, 100); await game.click(400, 500);
        await game.key('KeyP'); await game.click(150, 300); await game.click(408, 306); // b s'accroche à l'intersection
        const pairs = () => sandbox(s => s.portals.map(p => ({ a: [Math.round(p.a.x * 10) / 10, Math.round(p.a.y * 10) / 10], b: [Math.round(p.b.x * 10) / 10, Math.round(p.b.y * 10) / 10], consumable: p.consumable, oneWay: p.oneWay })));
        assert.deepEqual(await pairs(), [{ a: [150, 300], b: [400, 300], consumable: false, oneWay: false }]);

        await game.click(150, 300); // panneau d'options
        const panelClick = async prefix => {
            const pos = await sandbox((s, p) => { const t = s.portalPanel.find(t => t.text.startsWith(p)); return [t.x + 10, t.y + 8]; }, prefix);
            await game.click(...pos);
        };
        await panelClick('Usage unique');
        await panelClick('Sens');
        assert.deepEqual(await sandbox(s => s.portalPanel.map(t => t.text).slice(0, 2)), ['Usage unique : oui', "Sens : part d'ici"]);
        await panelClick('Fermer');

        await game.key('KeyD');
        await game.drag([[400, 100], [470, 100]]); // l'intersection passe en (435, 300) : b la suit
        assert.deepEqual((await pairs())[0].b, [435, 300]);

        await game.key('KeyQ'); await game.click(600, 300);
        await game.key('KeyA'); await game.click(442, 480);
        await game.key('KeyX');
        await game.page.waitForTimeout(2500);
        const levels = await onlineLevels(server.url);
        const saved = levels[levels.length - 1];
        assert.equal(saved.json.portals.length, 1);
        assert.deepEqual(saved.json.portals[0].b.lines.sort(), [0, 1]);
        assert.equal(saved.json.portals[0].consumable, true);
        assert.equal(saved.json.portals[0].oneWay, true);

        const before = await pairs();
        await game.startScene('Sandbox', { level: saved });
        assert.deepEqual(await pairs(), before);

        await game.startScene('Niveau', { level_id: saved.id });
        let state = await game.play('portal0-a');
        assert.deepEqual([state.x, state.y, state.portals], [435, 300, 0]);
        state = await game.play('arrivee');
        assert.equal(state.gameOver, true);
    });

    it('extrémité de fil et portail au même endroit : la poignée du fil est prioritaire, celle du portail est décalée', async () => {
        await game.startScene('Sandbox', {});
        await game.key('KeyL'); await game.click(100, 300); await game.click(500, 300);
        await game.key('KeyP'); await game.click(100, 300); await game.click(500, 300); // un portail à chaque bout
        await game.key('KeyD');
        await game.drag([[500, 300], [500, 400]]); // extrémité du fil
        const state = () => sandbox(s => ({ line: [s.lines[0].geom.x2, s.lines[0].geom.y2].map(Math.round),
            b: [s.portals[0].b.x, s.portals[0].b.y].map(Math.round), handle: [s.portals[0].b.handle.x, s.portals[0].b.handle.y].map(Math.round) }));
        let st = await state();
        assert.deepEqual(st.line, [500, 400]);   // le fil a bougé
        assert.deepEqual(st.b, [500, 400]);      // le portail a suivi son bout de fil
        assert.notDeepEqual(st.handle, st.b);    // sa poignée est décalée
        await game.drag([st.handle, [st.handle[0] - 100, st.handle[1] - 25]]); // poignée du portail
        st = await state();
        assert.deepEqual(st.line, [500, 400]);   // le fil n'a pas bougé
        assert.ok(Math.abs(st.b[0] - 400) < 15, 'le portail a été déplacé le long du fil : ' + st.b);
    });

    it('poignées qui se chevauchent : c\'est la plus proche du curseur qui répond', async () => {
        // A, puis B dont le début est à 16 px de celui de A : les poignées et les croix de B sont dessus
        const draw = async () => {
            await game.startScene('Sandbox', {});
            await game.key('KeyL');
            await game.click(100, 300); await game.click(500, 300);
            await game.click(110, 288); await game.click(110, 100);
        };
        const geoms = () => sandbox(s => s.lines.map(l => l && [l.geom.x1, l.geom.y1, l.geom.x2, l.geom.y2].map(Math.round)));
        await draw();
        const before = await geoms();
        await game.key('KeyD');
        await game.drag([[100, 300], [100, 360]]); // pile sur le début de A
        const after = await geoms();
        assert.deepEqual(after[0].slice(0, 2), [100, 360]); // A a bougé
        assert.deepEqual(after[1], before[1]);              // B n'a pas bougé

        await draw();
        await game.key('KeyS');
        await game.click(102, 296); // sous les croix de A et de B, plus près de celle de A
        assert.deepEqual(await sandbox(s => Array.from(s.lines, l => !!l)), [false, true]);
    });

    it('mode suppression : dragon, puis fil avec ce qui est posé dessus', async () => {
        await game.startScene('Sandbox', {});
        await game.key('KeyL');
        await game.click(100, 300); await game.click(700, 300); // H
        await game.click(400, 100); await game.click(400, 500); // V
        await game.key('KeyG'); await game.click(250, 300);
        await game.key('KeyQ'); await game.click(150, 300);
        await game.key('KeyA'); await game.click(400, 450);
        await game.key('KeyP'); await game.click(600, 300); await game.click(400, 200);
        const counts = () => sandbox(s => ({ lines: s.lines.filter(Boolean).length, dragons: s.dragons.filter(Boolean).length,
            depart: !!s.depart, arrivee: !!s.arrivee, portals: s.portals.length }));
        assert.deepEqual(await counts(), { lines: 2, dragons: 1, depart: true, arrivee: true, portals: 1 });
        await game.key('KeyS');
        await game.click(250, 300); // croix du dragon
        assert.deepEqual(await counts(), { lines: 2, dragons: 0, depart: true, arrivee: true, portals: 1 });
        await game.click(400, 500); // croix au bout de V : V, l'arrivée et la paire de portails disparaissent
        assert.deepEqual(await counts(), { lines: 1, dragons: 0, depart: true, arrivee: false, portals: 0 });
    });

    it('rouvre un niveau sans décalage et le remplace', async () => {
        const id = (await api(server.url, { json: JSON.parse(readFileSync(new URL('./fixtures/ancien-niveau.json', import.meta.url))) })).body.id;
        await game.startScene('Niveaux');
        await game.page.waitForTimeout(1000);
        // Bouton « Éditer » de la ligne de ce niveau
        await game.page.evaluate(id => {
            const texts = game.scene.getScene('Niveaux').children.list.filter(o => o.type === 'Text');
            const row = texts.find(t => t.text.startsWith(id.slice(0, 8)));
            texts.find(t => t.text === 'Éditer' && t.y === row.y).emit('pointerdown');
        }, id);
        await game.page.waitForFunction(() => game.scene.isActive('Sandbox'));
        await game.page.waitForTimeout(800);
        const info = await sandbox(s => {
            const objects = [...s.dragons.filter(Boolean), s.depart, s.arrivee];
            const onLine = o => {
                const l = o.lines ? o.lines[0] : s.lines[o.lines_key[0]];
                return Phaser.Geom.Line.GetShortestDistance(new Phaser.Geom.Line(l.geom.x1, l.geom.y1, l.geom.x2, l.geom.y2), o) < 0.5;
            };
            return { id: s.editLevelId, lines: s.lines.length, dragons: objects.length - 2, onLine: objects.every(onLine),
                red: objects.filter(o => o.isTinted).length, lineOrigins: s.lines.every(l => l.originX === 0 && l.originY === 0) };
        });
        assert.deepEqual(info, { id, lines: 9, dragons: 8, onLine: true, red: 0, lineOrigins: true });

        // Ancien niveau : portails automatiques convertis en paires à usage unique
        assert.deepEqual(await sandbox(s => [s.portals.length, s.portals.every(p => p.consumable)]), [9, true]);

        await game.key('KeyX'); // confirmation « remplacer » acceptée
        await game.page.waitForTimeout(2500);
        const levels = await onlineLevels(server.url);
        assert.equal(levels.filter(l => l.id === id).length, 1);
        assert.equal(levels.find(l => l.id === id).json.portals.length, 9);
        assert.ok(levels.find(l => l.id === id).json.dragons.every(d => d.anchor && d.lines[0] >= 0));

        // « Nouveau niveau » ouvre ensuite un éditeur vide, pas le niveau qu'on vient d'éditer
        await game.page.evaluate(() => game.scene.getScene('Sandbox').scene.start('Niveaux'));
        await game.page.waitForFunction(() => game.scene.isActive('Niveaux'));
        await game.page.waitForTimeout(1000);
        await game.page.evaluate(() => game.scene.getScene('Niveaux').children.list.find(o => o.text === 'Nouveau niveau').emit('pointerdown'));
        await game.page.waitForFunction(() => game.scene.isActive('Sandbox'));
        await game.page.waitForTimeout(500);
        assert.deepEqual(await sandbox(s => [s.editLevelId, s.lines.length]), [null, 0]);
    });

    it('aucune erreur JavaScript', () => {
        assert.deepEqual(game.errors, []);
    });
});
