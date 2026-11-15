import { Intersection, Teleporteur, Arrivee, Dragon } from './objets.js';

// Déplacement du joueur et fin de partie de la scène Niveau (scenes/Niveau.js).
//
// L'arrivée sur la cible et le contact avec un dragon sont détectés par les collisions Arcade.
// Elles sont évaluées à chaque pas physique (1/60 s, soit 3,3 px à 200 px/s) et non à chaque image :
// même quand le navigateur rame, le joueur ne peut plus dépasser sa cible ni traverser un dragon.

const SPEED = 200;          // px/s
const PLAYER_RADIUS = 2;
const TARGET_RADIUS = 3;    // arrivée détectée à moins de 5 px du centre de la cible
const DRAGON_RADIUS = 18;   // mort à moins de 20 px du dragon

function setCircleBody(sprite, radius) {
    sprite.body.setCircle(radius, sprite.width / 2 - radius, sprite.height / 2 - radius);
}

// À appeler à la fin de create(), une fois scene.player, scene.objects et scene.dragons remplis.
export function startGameplay(scene) {
    const player = scene.player;
    const targets = scene.objects.filter(object => !(object instanceof Dragon));
    scene.gameOver = false;

    setCircleBody(player, PLAYER_RADIUS);
    targets.forEach(object => setCircleBody(object, TARGET_RADIUS));
    scene.dragons.forEach(dragon => setCircleBody(dragon, DRAGON_RADIUS));

    decoratePortals(scene);

    // Plusieurs objets peuvent se superposer (ex. portail en bout de fil sur un diamant)
    scene.input.setTopOnly(false);

    scene.objects.forEach(object => {
        object.on('pointerdown', () => {
            if (scene.gameOver || !object.isReachable()) {
                return;
            }
            player.setObject(object);
            if (!(object instanceof Intersection)) {
                player.setLines(object.lines);
            }
            // Clic sur l'objet où l'on se trouve déjà (ex. portail par lequel on vient d'arriver) : il s'active
            if (Phaser.Math.Distance.BetweenPoints(player, object) < 1) {
                arrive(scene, object);
                return;
            }
            scene.physics.moveToObject(player, object, SPEED);
        });
    });

    // Les dragons d'abord : si un dragon est sur le chemin de la cible, il gagne
    scene.physics.add.overlap(player, scene.dragons, (_player, dragon) => {
        if (!scene.gameOver && player.body.speed > 0) {
            die(scene, dragon);
        }
    });
    scene.physics.add.overlap(player, targets, (_player, object) => {
        if (!scene.gameOver && player.body.speed > 0 && object === player.object) {
            arrive(scene, object);
        }
    });
}

function arrive(scene, object) {
    const player = scene.player;
    player.body.reset(object.x, object.y);

    if (object instanceof Intersection) {
        player.setLines(object.lines);
    } else if (object instanceof Teleporteur) {
        if (object.brother && !object.disabled) {
            teleport(scene, object);
        } else {
            // Sortie d'un portail à sens unique : simple arrêt
            player.setLines(object.lines);
        }
    } else if (object instanceof Arrivee) {
        player.setLines(object.lines);
        endGame(scene, 'bravo');
    }
}

function teleport(scene, portal) {
    const player = scene.player;
    const exit = portal.brother;
    player.body.reset(exit.x, exit.y);
    player.setObject(exit);
    player.setLines(exit.lines);
    scene.portalLink.clear();
    if (portal.isConsumable) {
        consume(portal);
        consume(portal.partner || exit);
        // Si la sortie remplaçait une intersection, le joueur se retrouve sur cette intersection
        player.setObject(exit.replaces || null);
    }
}

// Retire un portail du jeu ; l'intersection qu'il remplaçait réapparaît
function consume(portal) {
    portal.lines.forEach(line => {
        line.objects = line.objects.filter(object => object !== portal);
    });
    if (portal.replaces) {
        portal.replaces.setVisible(true).setInteractive();
    }
    if (portal.ring) {
        portal.ring.destroy();
    }
    portal.destroy(true);
}

function die(scene, dragon) {
    scene.player.body.reset(dragon.x, dragon.y);
    dragon.anims.play('dragon');
    endGame(scene, 'recommencer');
}

function endGame(scene, imageKey) {
    scene.gameOver = true;
    scene.add.image(550, 400, imageKey)
        .setInteractive()
        .on('pointerdown', () => scene.scene.restart());
}

// ---- Indices visuels des portails ----
// Une couleur par paire (anneau autour des portails) ; au survol d'un portail, une liaison en pointillés vers son partenaire.
// Paire à sens unique : flèche vers la sortie, et sortie semi-transparente (elle ne mène nulle part).
// Paire à usage unique : anneau en pointillés (le joueur doit savoir qu'elle disparaîtra après usage).

export const PORTAL_COLORS = [0x4fc3f7, 0xffb74d, 0xce93d8, 0x81c784, 0xf06292, 0xfff176, 0x90a4ae, 0xff8a65];
const PORTAL_RADIUS = 22; // la liaison s'arrête au bord des portails

function decoratePortals(scene) {
    scene.portalLink = scene.add.graphics().setDepth(5);
    const portals = scene.objects.filter(object => object instanceof Teleporteur);
    const done = new Set();
    let pairIndex = 0;
    portals.forEach(portal => {
        if (done.has(portal)) {
            return;
        }
        const partner = portal.partner || portal.brother;
        if (!partner) {
            return;
        }
        // Sens unique : un seul des deux portails a un "frère" (sa destination)
        const source = portal.brother ? portal : partner;
        const exit = source === portal ? partner : portal;
        const oneWay = !exit.brother;
        const color = PORTAL_COLORS[pairIndex++ % PORTAL_COLORS.length];
        [source, exit].forEach(p => {
            done.add(p);
            // Anneau plutôt que teinte : le sprite, sombre et bleuté, rend mal les teintes
            p.ring = drawRing(scene, p.x, p.y, color, source.isConsumable).setDepth(p.depth);
            p.on('pointerover', () => drawPortalLink(scene, source, exit, color, oneWay));
            p.on('pointerout', () => scene.portalLink.clear());
        });
        if (oneWay) {
            exit.setAlpha(0.55);
            exit.ring.setAlpha(0.55);
        }
    });
}

function drawRing(scene, x, y, color, dashed) {
    return strokeRing(scene.add.graphics(), x, y, color, dashed);
}

// Anneau autour d'un portail ; en pointillés pour une paire à usage unique (aussi utilisé par l'éditeur)
export function strokeRing(g, x, y, color, dashed) {
    g.lineStyle(4, color, 1);
    const radius = 21, segments = dashed ? 10 : 1;
    for (let i = 0; i < segments; i++) {
        const start = (i / segments) * Math.PI * 2;
        const end = dashed ? start + (Math.PI * 2 / segments) * 0.55 : Math.PI * 2;
        g.beginPath();
        g.arc(x, y, radius, start, end);
        g.strokePath();
    }
    return g;
}

function drawPortalLink(scene, from, to, color, arrow) {
    scene.portalLink.clear();
    if (from.active && to.active) {
        strokePortalLink(scene.portalLink, from, to, color, arrow);
    }
}

// Liaison en pointillés entre deux portails, avec une flèche vers "to" si arrow (aussi utilisé par l'éditeur)
export function strokePortalLink(g, from, to, color, arrow) {
    const length = Phaser.Math.Distance.BetweenPoints(from, to);
    if (length <= PORTAL_RADIUS * 2) {
        return;
    }
    const ux = (to.x - from.x) / length, uy = (to.y - from.y) / length;
    const x1 = from.x + ux * PORTAL_RADIUS, y1 = from.y + uy * PORTAL_RADIUS;
    const x2 = to.x - ux * PORTAL_RADIUS, y2 = to.y - uy * PORTAL_RADIUS;
    g.lineStyle(3, color, 0.9);
    const dash = 10, gap = 7, total = length - PORTAL_RADIUS * 2;
    for (let d = 0; d < total; d += dash + gap) {
        const e = Math.min(d + dash, total);
        g.lineBetween(x1 + ux * d, y1 + uy * d, x1 + ux * e, y1 + uy * e);
    }
    if (arrow) {
        const size = 14;
        g.fillStyle(color, 0.95);
        g.fillTriangle(
            x2, y2,
            x2 - ux * size - uy * size * 0.6, y2 - uy * size + ux * size * 0.6,
            x2 - ux * size + uy * size * 0.6, y2 - uy * size - ux * size * 0.6);
    }
}
