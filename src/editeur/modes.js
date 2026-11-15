// Modes de saisie de l'éditeur, choisis au clavier :
// l : tracer un fil, g : dragon, q : départ, a : arrivée, p : portail, d : déplacer, s : supprimer
import { EditorLine, EditorObject, Handle } from './objets.js';
import { placeOnLine } from './ancrage.js';
import { generateIntersections, updateNetwork } from './reseau.js';
import { newPortalEnd, portalSnap, placePortalEnd, findPortalEnd, renderPortals, deletePortal, openPortalPanel, closePortalPanel } from './portails.js';
import { showMessage } from '../ui.js';

// Point le plus proche sur les fils : { x, y, line_key }
function lineSnap(scene, pointer) {
    const magnetPoint = scene.magnetize.magnetizeDragon(scene, scene.lines, pointer, false);
    return { x: magnetPoint.nearest_point.x, y: magnetPoint.nearest_point.y, line_key: magnetPoint.line_key };
}

const hasLines = scene => scene.lines.some(Boolean);

// Quitte le mode courant : écouteurs, aperçus, poignées et panneau retirés
function leaveMode(scene) {
    scene.input.off('pointerup');
    scene.input.off('pointerover');
    scene.input.off('pointermove');
    for (const key of ['drawing_dragon', 'drawing_depart', 'drawing_arrivee', 'drawing_portal', 'pendingPortal']) {
        if (scene[key]) {
            scene[key].destroy();
            delete scene[key];
        }
    }
    const withHandles = [...scene.lines.filter(Boolean), ...scene.dragons, scene.depart, scene.arrivee, ...scene.portals.flatMap(p => [p.a, p.b])];
    withHandles.filter(Boolean).forEach(object => {
        for (const key of ['handle', 'handle_start', 'handle_end', 'del', 'del_start', 'del_end']) {
            if (object[key] && object[key].destroy) {
                object[key].destroy();
                delete object[key];
            }
        }
    });
    closePortalPanel(scene);
    renderPortals(scene);
}

function enterMode(scene, mode) {
    leaveMode(scene);
    scene.mode = mode;
    scene.modeText.setText(mode);
}

// Aperçu qui suit le curseur, accroché au fil le plus proche, puis objet posé au clic
function placeObjectMode(scene, texture, ghostKey, onPlace, canPlace = () => true) {
    if (!hasLines(scene) || !canPlace()) return;
    scene[ghostKey] = scene.add.sprite(scene.input.mousePointer.x, scene.input.mousePointer.y, texture);
    scene.input.on('pointermove', pointer => {
        if (scene[ghostKey]) {
            const snap = lineSnap(scene, pointer);
            scene[ghostKey].setPosition(snap.x, snap.y);
        }
    });
    scene.input.on('pointerup', pointer => {
        if (!canPlace()) return;
        const snap = lineSnap(scene, pointer);
        const object = new EditorObject(texture, scene, snap.x, snap.y, texture);
        placeOnLine(scene, object, snap.line_key, snap);
        onPlace(object);
    });
}

export function lineMode(scene) {
    enterMode(scene, "line");
    scene.input.on('pointerup', pointer => {
        if (!scene.drawing_line) {
            // Premier clic : début du fil
            scene.drawing_line = new EditorLine("line" + scene.lines.length, scene, pointer.x, pointer.y, pointer.x, pointer.y);
        } else {
            // Second clic : fin du fil, aimantée aux intersections proches
            const line = scene.drawing_line;
            const magnetPoint = scene.magnetize.magnetize(scene, line, scene.intersections.flat(), pointer, 40, "end", false);
            line.setTo(line.geom.x1, line.geom.y1, magnetPoint.x, magnetPoint.y);
            line.status = "DRAWN";
            scene.lines.push(line);
            scene.drawing_line = null;
            generateIntersections(scene);
            updateNetwork(scene);
        }
    });
    scene.input.on('pointermove', pointer => {
        const line = scene.drawing_line;
        if (line) {
            line.setTo(line.geom.x1, line.geom.y1, pointer.x, pointer.y);
            scene.magnetize.magnetize(scene, line, scene.intersections.flat(), pointer, 40, "end", false);
        }
    });
}

export function dragonMode(scene) {
    enterMode(scene, "dragon");
    placeObjectMode(scene, 'dragon', 'drawing_dragon', dragon => scene.dragons.push(dragon));
}

export function departMode(scene) {
    enterMode(scene, "depart");
    placeObjectMode(scene, 'depart', 'drawing_depart', depart => {
        scene.depart = depart;
        scene.drawing_depart.destroy();
        delete scene.drawing_depart;
    }, () => !scene.depart);
}

export function arriveeMode(scene) {
    enterMode(scene, "arrivee");
    placeObjectMode(scene, 'flag', 'drawing_arrivee', arrivee => {
        scene.arrivee = arrivee;
        scene.drawing_arrivee.destroy();
        delete scene.drawing_arrivee;
    }, () => !scene.arrivee);
}

// Portails : clic A puis clic B ; clic sur un portail existant : panneau d'options
export function portalMode(scene) {
    enterMode(scene, "portail");
    if (!hasLines(scene)) return;
    scene.drawing_portal = scene.add.sprite(scene.input.mousePointer.x, scene.input.mousePointer.y, 'portal', 0).setAlpha(0.6).setDepth(2);
    scene.input.on('pointermove', pointer => {
        const snap = portalSnap(scene, pointer);
        scene.drawing_portal.setPosition(snap.x, snap.y);
    });
    scene.input.on('pointerup', (pointer, currentlyOver) => {
        if (currentlyOver.some(o => o.isPortalUi)) return; // clic dans le panneau d'options
        if (scene.portalPanel) { closePortalPanel(scene); return; } // clic ailleurs : ferme le panneau
        const hit = findPortalEnd(scene, pointer);
        if (hit && !scene.pendingPortal) { openPortalPanel(scene, hit.pair, hit.end); return; }
        const snap = portalSnap(scene, pointer);
        if (!scene.pendingPortal) {
            scene.pendingPortal = newPortalEnd(scene, snap.x, snap.y);
            placePortalEnd(scene, scene.pendingPortal, snap);
            showMessage(scene, "Posez l'autre portail de la paire");
        } else if (Phaser.Math.Distance.BetweenPoints(snap, scene.pendingPortal) > 30) {
            const b = newPortalEnd(scene, snap.x, snap.y);
            placePortalEnd(scene, b, snap);
            scene.portals.push({ a: scene.pendingPortal, b, consumable: false, oneWay: false });
            delete scene.pendingPortal;
            renderPortals(scene);
            showMessage(scene, "Paire posée : cliquez sur un portail pour ses options");
        }
    });
}

// Déplacement : poignées aux extrémités des fils et sur chaque objet
export function dragMode(scene) {
    enterMode(scene, "drag");
    scene.lines.forEach((line, key) => {
        if (!line) return;
        for (const end of ['start', 'end']) {
            const handle = new Handle(`${line.name}-${end}`, scene, end === 'start' ? line.geom.x1 : line.geom.x2, end === 'start' ? line.geom.y1 : line.geom.y2, 'drag', line);
            line['handle_' + end] = handle;
            handle.on('drag', pointer => {
                const magnetPoint = scene.magnetize.magnetize(scene, line, scene.intersections.flat(), pointer, 40, end, false);
                updateNetwork(scene); // les objets suivent leurs bornes, sur tous les fils
                handle.setPosition(magnetPoint.x, magnetPoint.y);
            });
            handle.on('dragend', () => {
                generateIntersections(scene);
                updateNetwork(scene);
            });
        }
    });
    const objects = [...scene.dragons, scene.depart, scene.arrivee].filter(Boolean);
    objects.forEach(object => {
        object.handle = new Handle(object.name, scene, object.x, object.y, 'drag', object);
        object.handle.on('drag', pointer => {
            const snap = lineSnap(scene, pointer);
            placeOnLine(scene, object, snap.line_key, snap);
        });
    });
    scene.portals.forEach(pair => [pair.a, pair.b].forEach(end => {
        end.handle = new Handle("portal", scene, end.x, end.y, 'drag', end);
        end.handle.on('drag', pointer => {
            placePortalEnd(scene, end, portalSnap(scene, pointer));
            renderPortals(scene);
        });
    }));
}

// Suppression : croix aux extrémités des fils et sur chaque objet
export function deleteMode(scene) {
    enterMode(scene, "suppression");
    const cross = (object, x, y, onDelete) => {
        const del = scene.physics.add.sprite(x, y, 'delete');
        del.depth = 20;
        del.setInteractive();
        del.on('pointerup', onDelete);
        return del;
    };
    scene.lines.forEach((line, key) => {
        if (!line) return;
        line.del_start = cross(line, line.geom.x1, line.geom.y1, () => deleteLine(scene, key));
        line.del_end = cross(line, line.geom.x2, line.geom.y2, () => deleteLine(scene, key));
    });
    scene.dragons.forEach(dragon => {
        dragon.del = cross(dragon, dragon.x, dragon.y, () => deleteObject(scene, dragon));
    });
    for (const object of [scene.depart, scene.arrivee].filter(Boolean)) {
        object.del = cross(object, object.x, object.y, () => deleteObject(scene, object));
    }
    scene.portals.forEach(pair => [pair.a, pair.b].forEach(end => {
        end.del = cross(end, end.x, end.y, () => deletePortal(scene, pair));
    }));
}

function deleteObject(scene, object) {
    for (const key of ['del', 'handle']) {
        if (object[key]) object[key].destroy();
    }
    object.destroy();
    scene.dragons = scene.dragons.filter(dragon => dragon !== object);
    if (scene.depart === object) scene.depart = null;
    if (scene.arrivee === object) scene.arrivee = null;
}

// Supprime un fil et tout ce qui est posé dessus
function deleteLine(scene, key) {
    const line = scene.lines[key];
    for (const k of ['del_start', 'del_end', 'handle_start', 'handle_end']) {
        if (line[k]) line[k].destroy();
    }
    line.destroy();
    delete scene.lines[key]; // les clés des autres fils ne changent pas (elles servent aux ancrages)
    const onLine = object => object && object.lines_key.includes(key);
    [...scene.dragons, scene.depart, scene.arrivee].filter(onLine).forEach(object => deleteObject(scene, object));
    scene.portals.filter(pair => onLine(pair.a) || onLine(pair.b)).forEach(pair => deletePortal(scene, pair));
    generateIntersections(scene);
    updateNetwork(scene);
}
