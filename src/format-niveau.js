// Format JSON d'un niveau, partagé par le jeu (scenes/Niveau.js) et l'éditeur (editeur/fichier.js).
// La validation côté serveur est dans api/save-level.php.
//
// Un niveau enregistré : { id, datetime, json } où json =
// {
//   lines:         [{ name, start: {x, y}, end: {x, y} }]                  les fils ; leur index sert de clé partout
//   intersections: [{ name, position: {x, y}, lines: [index] }]
//   dragons:       [{ name, position: {x, y}, lines: [index], anchor? }]
//   start:         { x, y, lines: [index], anchor? }                         départ du joueur
//   end:           { x, y, lines: [index], anchor? }                         arrivée (drapeau)
//   portals?:      [{ a: {x, y, lines, anchor?}, b: {x, y, lines, anchor?}, consumable, oneWay }]
// }
// - anchor (éditeur uniquement) : { line, prev, next, u } = segment entre deux bornes ('start', 'end' ou index
//   de l'autre fil) et position u (0..1) dans ce segment ; voir editeur/ancrage.js
// - portals absent (anciens niveaux) : un portail à usage unique à chaque bout de chaque fil, menant à l'autre bout
// - un portail posé sur une intersection la remplace en jeu ; oneWay : on va seulement de a vers b

export function isPlayable(level) {
    const json = level?.json || {};
    return json.start?.lines?.length > 0 && json.end?.lines?.length > 0;
}

// Portails d'un niveau, en convertissant ceux des anciens niveaux (sans liste "portals")
export function portalsOf(json) {
    if (Array.isArray(json.portals)) {
        return json.portals;
    }
    return json.lines.map((line, i) => ({
        a: { x: line.start.x, y: line.start.y, lines: [i] },
        b: { x: line.end.x, y: line.end.y, lines: [i] },
        consumable: true,
        oneWay: false,
    }));
}

// Position relative d'un point projeté sur un segment {x1, y1, x2, y2} : 0 = début, 1 = fin
export function paramOnLine(geom, point) {
    const dx = geom.x2 - geom.x1;
    const dy = geom.y2 - geom.y1;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq === 0) return 0;
    const t = ((point.x - geom.x1) * dx + (point.y - geom.y1) * dy) / lengthSq;
    return Math.min(1, Math.max(0, t));
}

export function pointOnLine(geom, t) {
    return { x: geom.x1 + (geom.x2 - geom.x1) * t, y: geom.y1 + (geom.y2 - geom.y1) * t };
}

// Distance d'un point au segment
export function distanceToLine(geom, point) {
    const p = pointOnLine(geom, paramOnLine(geom, point));
    return Math.hypot(p.x - point.x, p.y - point.y);
}
