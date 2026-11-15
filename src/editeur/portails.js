// PORTAILS DANS L'ÉDITEUR
//
// Une paire = { a, b, consumable, oneWay } ; a et b sont des EditorObject posés sur un fil, ancrés entre deux
// bornes comme les dragons. Posé près d'une intersection, un portail s'y accroche : en jeu, il la remplace.
// Sens unique : de a vers b. Couleur de la paire = son rang (même ordre que dans le jeu).
import { EditorObject } from './objets.js';
import { placeOnLine } from './ancrage.js';
import { PORTAL_COLORS, strokeRing, strokePortalLink } from '../jeu/Gameplay.js';

export function newPortalEnd(scene, x, y) {
    return new EditorObject("portal", scene, x, y, 'portal');
}

// Point d'accroche : intersection proche (le portail la remplacera en jeu), sinon point le plus proche des fils
export function portalSnap(scene, pointer) {
    let best = null;
    scene.intersections.flat().forEach(intersection => {
        if (intersection && intersection.active) {
            const d = Phaser.Math.Distance.BetweenPoints(pointer, intersection);
            if (d < 20 && (!best || d < best.d)) best = { d, intersection };
        }
    });
    if (best) {
        // Nom "intersection-i-j" : i est l'une des deux lignes
        const lineKey = Number(best.intersection.name.split('-')[1]);
        return { x: best.intersection.x, y: best.intersection.y, line_key: lineKey };
    }
    const magnetPoint = scene.magnetize.magnetizeDragon(scene, scene.lines, pointer, false);
    return { x: magnetPoint.nearest_point.x, y: magnetPoint.nearest_point.y, line_key: magnetPoint.line_key };
}

export function placePortalEnd(scene, end, snap) {
    placeOnLine(scene, end, snap.line_key, snap);
}

export function findPortalEnd(scene, pointer) {
    for (const pair of scene.portals) {
        for (const end of [pair.a, pair.b]) {
            if (Phaser.Math.Distance.BetweenPoints(pointer, end) < 22) return { pair, end };
        }
    }
    return null;
}

export function renderPortals(scene) {
    const g = scene.portalGraphics;
    g.clear();
    scene.portals.forEach((pair, i) => {
        const color = PORTAL_COLORS[i % PORTAL_COLORS.length];
        strokeRing(g, pair.a.x, pair.a.y, color, pair.consumable);
        strokeRing(g, pair.b.x, pair.b.y, color, pair.consumable);
        strokePortalLink(g, pair.a, pair.b, color, pair.oneWay);
        pair.b.setAlpha(pair.oneWay ? 0.55 : 1);
    });
}

export function deletePortal(scene, pair) {
    [pair.a, pair.b].forEach(end => {
        if (end.handle) end.handle.destroy();
        if (end.del) end.del.destroy();
        end.destroy();
    });
    scene.portals = scene.portals.filter(p => p !== pair);
    renderPortals(scene);
}

// Panneau d'options d'une paire, ouvert en cliquant sur un de ses portails en mode portail
export function openPortalPanel(scene, pair, end) {
    closePortalPanel(scene);
    const x = Phaser.Math.Clamp(end.x + 28, 0, 540);
    const y = Phaser.Math.Clamp(end.y - 12, 0, 470);
    const style = { fontFamily: 'Arial Black', fontSize: 16, color: '#000000', backgroundColor: '#ffffffdd', padding: { x: 6, y: 3 } };
    const directionLabel = () => !pair.oneWay ? "Sens : dans les deux sens" : (pair.a === end ? "Sens : part d'ici" : "Sens : arrive ici");
    const items = [
        [() => "Usage unique : " + (pair.consumable ? "oui" : "non"), () => { pair.consumable = !pair.consumable; }],
        [directionLabel, () => {
            // deux sens -> part d'ici -> arrive ici -> deux sens
            if (!pair.oneWay) {
                if (pair.b === end) [pair.a, pair.b] = [pair.b, pair.a];
                pair.oneWay = true;
            } else if (pair.a === end) {
                [pair.a, pair.b] = [pair.b, pair.a];
            } else {
                pair.oneWay = false;
            }
        }],
        [() => "Supprimer la paire", () => { deletePortal(scene, pair); closePortalPanel(scene); }],
        [() => "Fermer", () => closePortalPanel(scene)],
    ];
    scene.portalPanel = items.map(([label, action], i) => {
        const text = scene.add.text(x, y + i * 28, label(), style).setDepth(30).setInteractive();
        text.isPortalUi = true;
        text.on('pointerup', () => {
            action();
            renderPortals(scene);
            if (scene.portalPanel) scene.portalPanel.forEach((t, j) => t.setText(items[j][0]()));
        });
        return text;
    });
}

export function closePortalPanel(scene) {
    if (scene.portalPanel) {
        scene.portalPanel.forEach(text => text.destroy());
        delete scene.portalPanel;
    }
}
