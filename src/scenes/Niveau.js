// Joue un niveau (format : voir format-niveau.js). Déplacement, arrivée et dragons : voir jeu/Gameplay.js
import { Line, Player, Teleporteur, Dragon, Intersection, Arrivee } from '../jeu/objets.js';
import { startGameplay } from '../jeu/Gameplay.js';
import { loadLevels } from '../niveaux.js';
import { isPlayable, portalsOf } from '../format-niveau.js';
import { addBackground, addButton, addFullscreenButton } from '../ui.js';

export class Niveau extends Phaser.Scene
{
    constructor ()
    {
        super('Niveau');
    }

    init (data)
    {
        this.level_id = data.level_id;
        // Scène où ramène le bouton retour : la liste des niveaux, ou le menu pour le niveau 1 lancé par « Click to Start »
        this.backTo = data.backTo || 'Niveaux';
    }

    async create()
    {
        addBackground(this);
        addFullscreenButton(this);
        addButton(this, 755, 135, 'restart', () => this.scene.restart());
        addButton(this, 755, 225, 'back', () => this.scene.start(this.backTo));

        this.graphics = this.add.graphics({ lineStyle: { width: 4, color: 0xaa00aa } });
        this.objects = [];        // objets cliquables (intersections, portails, dragons, arrivée)
        this.lines = [];
        this.intersections = [];
        this.dragons = [];

        const level = (await loadLevels()).find(l => l.id == this.level_id);
        if (!isPlayable(level)) {
            console.error("Niveau introuvable ou incomplet (départ/arrivée manquant) :", this.level_id);
            this.scene.start('Niveaux');
            return;
        }
        const json = level.json;

        this.player = new Player(this, json.start.x, json.start.y, 'flower');

        json.lines.forEach((l, key) => {
            this.lines.push(new Line(`line${key}`, this.graphics, l.start.x, l.start.y, l.end.x, l.end.y));
        });

        json.intersections.forEach((data, key) => {
            const intersection = new Intersection(`intersection${key}`, this, data.position.x, data.position.y, 'diamonds', this.player);
            data.lines.forEach(k => {
                intersection.addLine(this.lines[k]);
                this.lines[k].addObjects([intersection]);
            });
            this.intersections.push(intersection);
        });

        createPortals(this, portalsOf(json));

        this.player.setLines(json.start.lines.map(k => this.lines[k]));

        json.dragons.forEach((data, key) => {
            const dragon = new Dragon(`dragon${key}`, this, data.position.x, data.position.y, 'dragon', this.player);
            data.lines.forEach(k => { if (this.lines[k]) dragon.addLine(this.lines[k]); });
            this.dragons.push(dragon);
        });

        // L'arrivée n'est posée que sur son premier fil
        const endLine = this.lines[json.end.lines[0]];
        this.arrivee = new Arrivee("arrivee", this, json.end.x, json.end.y, 'flag', this.player);
        this.arrivee.addLine(endLine);
        endLine.addObjects([this.arrivee]);

        startGameplay(this);
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
