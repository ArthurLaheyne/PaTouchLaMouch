// Ouverture, export et enregistrement des niveaux dans l'éditeur (format : voir format-niveau.js)
import { EditorLine, EditorObject } from './objets.js';
import { setAnchor, countWarnings } from './ancrage.js';
import { newPortalEnd } from './portails.js';
import { generateIntersections, updateNetwork } from './reseau.js';
import { portalsOf, distanceToLine } from '../format-niveau.js';
import { addText, showMessage } from '../ui.js';

// Recrée dans l'éditeur un niveau enregistré (fils, dragons, départ, arrivée, portails et leurs ancrages)
export function loadLevel(scene, level) {
    const json = level.json;
    scene.editLevelId = level.id;
    json.lines.forEach((l, i) => {
        const line = new EditorLine("line" + i, scene, l.start.x, l.start.y, l.end.x, l.end.y);
        line.status = "DRAWN";
        scene.lines.push(line);
    });
    generateIntersections(scene);

    // Fil de l'objet : celui enregistré si l'objet est bien dessus, sinon le plus proche
    // (les anciens exports pouvaient enregistrer un fil faux, ex. -1 pour les dragons)
    const lineKeyFor = (keys, position) => {
        const saved = (keys || []).find(k => scene.lines[k]);
        if (saved !== undefined && distanceToLine(scene.lines[saved].geom, position) < 2) return saved;
        return scene.magnetize.magnetizeDragon(scene, scene.lines, position).line_key;
    };
    const place = (object, data) => {
        const lineKey = lineKeyFor(data.lines, data);
        object.lines_key = [lineKey];
        if (data.anchor && data.anchor.line === lineKey) {
            const { line, prev, next, u } = data.anchor;
            object.anchor = { line, prev, next, u };
        } else {
            setAnchor(scene, object, lineKey, object);
        }
        return object;
    };

    json.dragons.forEach(d => {
        scene.dragons.push(place(new EditorObject("dragon", scene, d.position.x, d.position.y, 'dragon'), { ...d, ...d.position }));
    });
    if (json.start?.lines?.length) {
        scene.depart = place(new EditorObject("depart", scene, json.start.x, json.start.y, 'depart'), json.start);
    }
    if (json.end?.lines?.length) {
        scene.arrivee = place(new EditorObject("arrivee", scene, json.end.x, json.end.y, 'flag'), json.end);
    }
    // Anciens niveaux sans liste de portails : portails automatiques convertis en paires (même résultat en jeu)
    portalsOf(json).forEach(pair => {
        scene.portals.push({
            a: place(newPortalEnd(scene, pair.a.x, pair.a.y), pair.a),
            b: place(newPortalEnd(scene, pair.b.x, pair.b.y), pair.b),
            consumable: !!pair.consumable,
            oneWay: !!pair.oneWay,
        });
    });
    updateNetwork(scene);
    addText(scene, 400, 0, "Édition du niveau " + level.id.slice(0, 8)).setOrigin(0.5, 0);
}

// Niveau de l'éditeur au format JSON. Les fils supprimés laissent des trous dans scene.lines :
// les index exportés sont renumérotés (index dans json.lines).
export function exportLevel(scene) {
    const keys = [];
    scene.lines.forEach((line, key) => { if (line) keys.push(key); });
    const index = key => keys.indexOf(key);
    const point = o => ({ x: o.x, y: o.y });

    const lines = keys.map((key, i) => {
        const g = scene.lines[key].geom;
        return { name: i, start: { x: g.x1, y: g.y1 }, end: { x: g.x2, y: g.y2 } };
    });

    // Intersections fusionnées par position (plusieurs fils peuvent se croiser au même point)
    const intersections = [];
    scene.intersections.forEach((row, i) => row.forEach((intersection, j) => {
        if (!intersection) return;
        const position = { x: Math.round(intersection.x * 1000) / 1000, y: Math.round(intersection.y * 1000) / 1000 };
        const existing = intersections.find(other => other.position.x === position.x && other.position.y === position.y);
        if (existing) {
            [index(i), index(j)].forEach(k => { if (!existing.lines.includes(k)) existing.lines.push(k); });
        } else {
            intersections.push({ name: i + '-' + j, position, lines: [index(i), index(j)] });
        }
    }));

    // Ancrage exprimé avec les nouveaux index
    const anchor = a => {
        if (!a) return undefined;
        const node = k => (k === 'start' || k === 'end') ? k : index(k);
        const out = { line: index(a.line), prev: node(a.prev), next: node(a.next), u: a.u };
        return (out.line < 0 || out.prev === -1 || out.next === -1) ? undefined : out;
    };
    const placed = o => ({ lines: o.lines_key.map(index), anchor: anchor(o.anchor) });

    // Un portail sur une intersection liste tous les fils qui y passent
    const portalEnd = end => {
        const own = end.lines_key[0];
        const through = keys.filter(key => key !== own && distanceToLine(scene.lines[key].geom, end) < 0.5);
        return { ...point(end), lines: [own, ...through].map(index), anchor: anchor(end.anchor) };
    };

    return {
        lines,
        intersections,
        dragons: scene.dragons.map((dragon, i) => ({ name: i, position: point(dragon), ...placed(dragon) })),
        start: scene.depart ? { ...point(scene.depart), ...placed(scene.depart) } : {},
        end: scene.arrivee ? { ...point(scene.arrivee), ...placed(scene.arrivee) } : {},
        // Toujours exportés (liste explicite, même vide)
        portals: scene.portals.map(pair => ({ a: portalEnd(pair.a), b: portalEnd(pair.b), consumable: pair.consumable, oneWay: pair.oneWay })),
    };
}

// Enregistre le niveau sur le serveur (api/save-level.php, remplace l'API AWS éteinte le 2026-11-14).
// Sans serveur PHP (ex. en local avec http-server), propose de télécharger le niveau à la place.
export async function saveLevel(scene, json) {
    if (scene.saving) return;
    const warnings = countWarnings(scene);
    if (warnings > 0 && !window.confirm(warnings + " élément(s) en rouge : leur segment a changé (intersection disparue ou ajoutée). Enregistrer quand même ?")) return;
    let action = "create";
    if (scene.editLevelId) {
        action = window.confirm("Remplacer le niveau d'origine ?\n\nOK : remplacer\nAnnuler : enregistrer comme nouveau niveau") ? "replace" : "create";
    }
    const password = window.prompt("Mot de passe pour enregistrer le niveau :");
    if (password === null) return;
    scene.saving = true;
    showMessage(scene, "Enregistrement...");
    try {
        const response = await fetch("api/save-level.php", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=UTF-8" },
            body: JSON.stringify({ password, action, id: scene.editLevelId, json }),
        });
        const result = await response.json().catch(() => null);
        if (response.ok && result?.ok) {
            // Les enregistrements suivants proposeront de remplacer ce niveau
            scene.editLevelId = result.id;
            showMessage(scene, action === "replace" ? "Niveau remplacé !" : "Niveau enregistré !", "#006600");
        } else if (result?.error) {
            showMessage(scene, result.error, "#aa0000");
        } else {
            throw new Error("HTTP " + response.status);
        }
    } catch (error) {
        console.error(error);
        showMessage(scene, "Serveur indisponible", "#aa0000");
        if (window.confirm("Le serveur n'a pas pu enregistrer le niveau. Le télécharger à la place ?")) {
            downloadLevel(json);
        }
    } finally {
        scene.saving = false;
    }
}

function downloadLevel(json) {
    const id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "niveau-" + Date.now();
    const level = { id, datetime: new Date().toISOString(), json };
    const blob = new Blob([JSON.stringify(level, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "niveau-" + id + ".json";
    link.click();
    URL.revokeObjectURL(link.href);
}
