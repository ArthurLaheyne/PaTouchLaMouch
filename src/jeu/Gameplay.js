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

    // Chemin mis en lumière au survol d'un objet atteignable : le segment de fil que le joueur va parcourir
    // Juste au-dessus du dessin des fils, sous les diamants, portails et dragons
    scene.pathHighlight = scene.add.graphics();
    scene.children.moveTo(scene.pathHighlight, scene.children.getIndex(scene.graphics) + 1);
    scene.objects.forEach(object => {
        object.on('pointerover', () => { scene.hovered = object; showPath(scene); });
        object.on('pointerout', () => { if (scene.hovered === object) scene.hovered = null; showPath(scene); });
    });

    // Plusieurs objets peuvent se superposer (ex. portail en bout de fil sur un diamant)
    scene.input.setTopOnly(false);

    scene.objects.forEach(object => {
        object.on('pointerdown', () => {
            if (scene.gameOver || !object.isReachable()) {
                return;
            }
            player.setObject(object);
            scene.pathHighlight.clear();
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
    // La souris est peut-être déjà sur le prochain objet : on montre son chemin depuis la nouvelle position
    scene.time.delayedCall(0, () => showPath(scene));

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

const PATH_COLOR = 0xffffff;

function showPath(scene) {
    const g = scene.pathHighlight, player = scene.player, target = scene.hovered;
    g.clear();
    if (!target || !target.active || scene.gameOver || player.body.speed > 0 || !target.isReachable()) return;
    if (Phaser.Math.Distance.BetweenPoints(player, target) < 1) return;
    g.lineStyle(10, PATH_COLOR, 0.45);
    g.lineBetween(player.x, player.y, target.x, target.y);
}

function teleport(scene, portal) {
    const player = scene.player;
    const exit = portal.brother;
    player.body.reset(exit.x, exit.y);
    player.setObject(exit);
    player.setLines(exit.lines);
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
// Une couleur par paire (anneau autour des portails). Pas de liaison entre les deux portails en jeu (seulement dans
// l'éditeur) : le joueur associe les paires par leur couleur.
// Paire à sens unique : sortie semi-transparente (elle ne mène nulle part).
// Paire à usage unique : anneau en pointillés (le joueur doit savoir qu'elle disparaîtra après usage).

export const PORTAL_COLORS = [0x4fc3f7, 0xffb74d, 0xce93d8, 0x81c784, 0xf06292, 0xfff176, 0x90a4ae, 0xff8a65];

function decoratePortals(scene) {
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

