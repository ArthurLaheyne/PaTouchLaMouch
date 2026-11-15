import { Line, Player, Teleporteur, Dragon, Intersection, Arrivee } from './Objects.js';
import { startGameplay } from './Gameplay.js';
import { loadLevels, isPlayable } from './levels.js';

export class Niveau extends Phaser.Scene
{
    constructor ()
    {
        super('Niveau');
    }

    init (data)
    {
        this.level_id = data.level_id;
    }

    preload() {
    }

    async create()
    {

        const scene = this
        
        this.background = this.add.image(0, 0, 'ocean').setOrigin(0, 0);
        this.background.displayWidth = this.sys.canvas.width;
        this.background.displayHeight = this.sys.canvas.height;

        const button_fullscreen = this.add.image(800 - 45, 45, 'fullscreen', 0).setOrigin(0.5, 0.5).setInteractive();
        button_fullscreen.on('pointerup', function ()
        {
            if (this.scale.isFullscreen) {
                button_fullscreen.setFrame(0);
                this.scale.stopFullscreen();
            } else {
                button_fullscreen.setFrame(1);
                this.scale.startFullscreen();
            }
        }, this);
        button_fullscreen.on('pointerover', () => {
            this.tweens.add({
                targets: button_fullscreen,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200,
                ease: 'Linear'
            });
        });
        button_fullscreen.on('pointerout', () => {
            this.tweens.add({
                targets: button_fullscreen,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Linear'
            });
        });
        
        const button_recommencer = this.add.image(800 - 45, 135, 'restart', 0).setOrigin(0.5, 0.5).setInteractive();
        button_recommencer.on('pointerdown', (event) => {
            this.scene.restart();
        });
        button_recommencer.on('pointerover', () => {
            this.tweens.add({
                targets: button_recommencer,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200,
                ease: 'Linear'
            });
        });
        button_recommencer.on('pointerout', () => {
            this.tweens.add({
                targets: button_recommencer,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Linear'
            });
        });
        
        const button_back = this.add.image(800 - 45, 225, 'back', 0).setOrigin(0.5, 0.5).setInteractive();
        button_back.on('pointerdown', (event) => {
            this.scene.start('Niveaux');
        });
        button_back.on('pointerover', () => {
            this.tweens.add({
                targets: button_back,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200,
                ease: 'Linear'
            });
        });
        button_back.on('pointerout', () => {
            this.tweens.add({
                targets: button_back,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Linear'
            });
        });

        this.anims.create({
            key: 'portal',
            frames: this.anims.generateFrameNumbers('portal', { start: 0, end: 13 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'dude',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'intersection',
            frames: this.anims.generateFrameNumbers('diamonds', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'dragon',
            frames: this.anims.generateFrameNumbers('dragon', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });       
        
        
    
        scene.graphics = this.add.graphics({ lineStyle: { width: 4, color: 0xaa00aa } })
        scene.objects = []
        scene.player;
        scene.lines = [];
        scene.intersections = [];
        scene.dragons = [];
        
        
        
        // Niveaux en fichier depuis l'extinction de l'API AWS, le 2026-11-14 (voir levels.js)
        const data = (await loadLevels()).find((level) => level.id == scene.level_id);
        if (!isPlayable(data)) {
            console.error("Niveau introuvable ou incomplet (départ/arrivée manquant) :", scene.level_id);
            this.scene.start('Niveaux');
            return;
        }
        let levelData = data.json;

        console.log(levelData);
        

        scene.player = new Player(this, levelData.start.x, levelData.start.y, 'flower')
        
        // Portails : liste explicite de paires "portals" ; sans elle (anciens niveaux), un portail à chaque bout
        // de chaque fil, qui mène à l'autre bout du même fil
        const explicitPortals = Array.isArray(levelData.portals);

        levelData.lines.forEach((lineData, key) => {
            let line = new Line(`line${key}`, scene, this.graphics, lineData.start.x, lineData.start.y, lineData.end.x, lineData.end.y, this.player, !explicitPortals)
            this.lines.push(line);
        });

        levelData.intersections.forEach((intersectionData, key) => {
            let intersection = new Intersection(`intersection${key}`, scene, intersectionData.position.x, intersectionData.position.y, 'diamonds', scene.player)
            intersectionData.lines.forEach(line => {
                intersection.addLine(scene.lines[line])
                this.lines[line].addObjects([intersection])
            });
            this.intersections.push(intersection);
        });

        if (explicitPortals) {
            createPortals(scene, levelData.portals);
        }

        this.player.setLines(levelData.start.lines.map(line_key => this.lines[line_key]))
        // this.player.setObject(scene.intersections[0]);

        levelData.dragons.forEach((dragonData, key) => {
            let dragon = new Dragon(`dragon${key}`, scene, dragonData.position.x, dragonData.position.y, 'dragon', scene.player);
            dragonData.lines.forEach(line => {
                dragon.addLine(scene.lines[line])
            });
            scene.dragons.push(dragon);
        });

        this.arrivee = new Arrivee("arrivee", scene, levelData.end.x, levelData.end.y, 'flag', this.player);
        this.arrivee.addLine(levelData.end.lines.map(line_key => this.lines[line_key])[0]) // On ajoute uniquement la premiere, l'objet arrivee n'est pas prévu pour supporter plusieurs lignes pour le moment
        levelData.end.lines.map(line_key => this.lines[line_key])[0].addObjects([this.arrivee])

        // Déplacement, arrivée et dragons : voir Gameplay.js
        startGameplay(this);
    }

    update()
    {
    }
}

// Crée les paires de portails d'un niveau.
// Chaque paire : { a: {x, y, lines}, b: {x, y, lines}, consumable, oneWay }
//   consumable : la paire disparaît après usage
//   oneWay     : on ne va que de a vers b (b est une simple sortie)
// Un portail posé sur une intersection la remplace : l'intersection est masquée, le portail prend tous ses fils
// (on peut y aller depuis chacun d'eux, et en sortant de l'autre portail on accède à tous). Si la paire est à
// usage unique, l'intersection réapparaît une fois le portail consommé.
function createPortals(scene, portals) {
    portals.forEach((pair, key) => {
        const make = (end, suffix) => {
            const portal = new Teleporteur(`portal${key}-${suffix}`, scene, end.x, end.y, 'portal', scene.player, !!pair.consumable);
            const lines = new Set(end.lines.map(k => scene.lines[k]).filter(Boolean));
            const intersection = scene.intersections.find(i => i.visible && Phaser.Math.Distance.Between(i.x, i.y, end.x, end.y) < 1);
            if (intersection) {
                intersection.lines.forEach(line => lines.add(line));
                intersection.setVisible(false).disableInteractive();
                portal.replaces = intersection;
            }
            lines.forEach(line => {
                portal.addLine(line);
                line.addObjects([portal]);
            });
            return portal;
        };
        const a = make(pair.a, 'a');
        const b = make(pair.b, 'b');
        a.setBrother(b);
        b.setBrother(pair.oneWay ? null : a);
        a.partner = b;
        b.partner = a;
    });
}
