// Éditeur de niveaux. Le travail est fait par les modules de editeur/ :
// modes.js (saisie au clavier et à la souris), ancrage.js, portails.js, reseau.js, fichier.js (ouvrir / enregistrer)
import { Magnetize } from '../editeur/magnetize.js';
import { lineMode, dragonMode, departMode, arriveeMode, portalMode, dragMode, deleteMode } from '../editeur/modes.js';
import { loadLevel, exportLevel, saveLevel } from '../editeur/fichier.js';
import { addBackground, addButton, addFullscreenButton, addText } from '../ui.js';

const MODES = [
    ['L', "Line (l)", lineMode],
    ['D', "Drag (d)", dragMode],
    ['G', "Dragon (g)", dragonMode],
    ['S', "Suppression (s)", deleteMode],
    ['Q', "Depart (q)", departMode],
    ['A', "Arrivée (a)", arriveeMode],
    ['X', "Exporter (x)", scene => saveLevel(scene, exportLevel(scene))],
    ['P', "Portail (p)", portalMode],
];

export class Sandbox extends Phaser.Scene
{
    constructor ()
    {
        super('Sandbox');
    }

    init(data)
    {
        // Niveau à éditer (bouton "Éditer" de la liste des niveaux), sinon nouveau niveau
        this.editLevel = data && data.level ? data.level : null;
        this.editLevelId = null;
    }

    create()
    {
        addBackground(this);
        addFullscreenButton(this);
        addButton(this, 755, 135, 'back', () => this.scene.start('Niveaux'), 'pointerup');

        // État de l'éditeur
        this.lines = [];          // EditorLine ; trous possibles (fils supprimés), la clé sert aux ancrages
        this.intersections = [];  // intersections[i][j] pour i < j
        this.dragons = [];
        this.depart = null;
        this.arrivee = null;
        this.portals = [];        // { a, b, consumable, oneWay }
        this.drawing_line = null;
        this.portalGraphics = this.add.graphics().setDepth(5);
        this.magnetize = new Magnetize(this, []);

        // Menu des modes (touches du clavier)
        this.mode = "";
        MODES.forEach(([key, label, action], i) => {
            addText(this, 0, i * 30, label).setOrigin(0);
            this.input.keyboard.on('keydown-' + key, () => action(this));
        });
        this.modeText = addText(this, 800, 600, "mode : ").setAlign('right').setOrigin(1);

        if (this.editLevel) {
            loadLevel(this, this.editLevel);
        }
    }
}
