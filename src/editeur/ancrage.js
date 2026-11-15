// ANCRAGE DES OBJETS POSÉS SUR LES FILS (dragons, départ, arrivée, portails)
//
// Un dragon bloque un segment de fil compris entre deux "bornes" : deux intersections consécutives,
// ou une intersection et une extrémité du fil. Le départ, l'arrivée et les portails sont eux aussi dans un
// segment, d'un côté ou de l'autre des dragons.
// On retient donc pour chaque objet : sa ligne, ses deux bornes et sa position u (0..1) entre elles.
// Une borne est identifiée par 'start', 'end' ou la clé de l'autre ligne (deux lignes droites ne se
// croisent qu'une fois). Quand un fil bouge, l'objet est replacé entre ses bornes, même si un autre
// croisement est venu se placer entre elles. Si une de ses bornes disparaît (les fils ne se croisent plus),
// l'objet reste où il est sur son fil et se raccroche aux bornes qui l'entourent désormais.
import { paramOnLine, pointOnLine } from '../format-niveau.js';

const EPSILON_T = 1e-6;

// Objets ancrés de la scène
export function anchoredObjects(scene) {
    return [...scene.dragons, scene.depart, scene.arrivee, ...scene.portals.flatMap(pair => [pair.a, pair.b])].filter(Boolean);
}

// Bornes d'une ligne (extrémités et intersections), triées le long de la ligne
export function nodesOnLine(scene, lineKey) {
    const line = scene.lines[lineKey];
    const nodes = [{ id: 'start', t: 0 }, { id: 'end', t: 1 }];
    scene.lines.forEach((other, otherKey) => {
        if (other && otherKey !== lineKey) {
            const point = Phaser.Geom.Intersects.GetLineToLine(line.geom, other.geom);
            if (point) nodes.push({ id: otherKey, t: paramOnLine(line.geom, point) });
        }
    });
    return nodes.sort((n1, n2) => n1.t - n2.t);
}

// Calcule l'ancrage d'un objet qu'on vient de poser ou de déplacer à la main
export function setAnchor(scene, object, lineKey, point) {
    const t = paramOnLine(scene.lines[lineKey].geom, point);
    const nodes = nodesOnLine(scene, lineKey);
    let i = 0;
    // Premier segment de longueur non nulle qui contient t
    while (i < nodes.length - 2 && (nodes[i + 1].t < t || nodes[i + 1].t - nodes[i].t < EPSILON_T)) i++;
    const prev = nodes[i], next = nodes[i + 1];
    const length = next.t - prev.t;
    object.anchor = {
        line: lineKey,
        prev: prev.id,
        next: next.id,
        u: length > EPSILON_T ? Phaser.Math.Clamp((t - prev.t) / length, 0, 1) : 0,
    };
}

// Pose un objet sur un fil : position, fil, ancrage, poignée
export function placeOnLine(scene, object, lineKey, point) {
    placeObject(object, point.x, point.y);
    object.lines_key = [lineKey];
    setAnchor(scene, object, lineKey, point);
}

function placeObject(object, x, y) {
    object.setPosition(x, y);
    if (object.handle) {
        // La poignée peut être décalée de l'objet (voir handleOffset dans modes.js)
        const offset = object.handle.offset || { x: 0, y: 0 };
        object.handle.setPosition(x + offset.x, y + offset.y);
    }
}

// Replace un objet entre ses bornes ; si l'une a disparu, il garde sa place et se raccroche aux bornes voisines
function relocate(scene, object) {
    const anchor = object.anchor;
    if (!anchor) return;
    const line = scene.lines[anchor.line];
    if (!line) return; // Ligne supprimée : l'objet est supprimé avec elle
    const nodes = nodesOnLine(scene, anchor.line);
    const prev = nodes.find(n => n.id === anchor.prev);
    const next = nodes.find(n => n.id === anchor.next);
    if (!prev || !next) {
        const p = pointOnLine(line.geom, paramOnLine(line.geom, object));
        placeObject(object, p.x, p.y);
        setAnchor(scene, object, anchor.line, p);
        return;
    }
    const p = pointOnLine(line.geom, prev.t + anchor.u * (next.t - prev.t));
    placeObject(object, p.x, p.y);
}

// Après toute modification du réseau : un fil déplacé déplace aussi les bornes des autres fils
export function relocateAll(scene) {
    anchoredObjects(scene).forEach(object => relocate(scene, object));
}

