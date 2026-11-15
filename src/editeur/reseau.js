// Réseau de fils de l'éditeur : intersections et mise à jour des objets posés après une modification
import { EditorIntersection } from './objets.js';
import { relocateAll } from './ancrage.js';
import { renderPortals } from './portails.js';

// Recalcule les intersections : scene.intersections[i][j] (i < j) pour chaque paire de fils qui se croisent
export function generateIntersections(scene) {
    scene.intersections.forEach(row => row.forEach(intersection => intersection && intersection.destroy()));
    const lines = scene.lines;
    const intersections = [];
    for (let i = 0; i < lines.length - 1; i++) {
        if (!lines[i]) continue;
        intersections[i] = [];
        for (let j = i + 1; j < lines.length; j++) {
            if (!lines[j]) continue;
            const point = Phaser.Geom.Intersects.GetLineToLine(lines[i].geom, lines[j].geom);
            if (point) {
                intersections[i][j] = new EditorIntersection(`intersection-${i}-${j}`, scene, point.x, point.y, 'diamonds');
            }
        }
    }
    scene.intersections = intersections;
}

// Après toute modification des fils : objets replacés entre leurs bornes, portails redessinés
export function updateNetwork(scene) {
    relocateAll(scene);
    renderPortals(scene);
}
