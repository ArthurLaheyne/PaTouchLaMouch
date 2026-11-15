import { Intersection, Teleporteur, Arrivee, Dragon } from './Objects.js';

// Déplacement du joueur et fin de partie, communs aux scènes Game et Niveau.
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
