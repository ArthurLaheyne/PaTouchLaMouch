// Liste des niveaux : jouer, éditer, ou créer un nouveau niveau
import { loadLevels } from '../niveaux.js';
import { isPlayable } from '../format-niveau.js';
import { addBackground, addButton, addFullscreenButton, addText, addTextButton } from '../ui.js';

export class Niveaux extends Phaser.Scene
{
    constructor ()
    {
        super('Niveaux');
    }

    async create()
    {
        addBackground(this);
        addFullscreenButton(this);
        addButton(this, 755, 135, 'back', () => this.scene.start('MainMenu'));

        // {} explicite : sans données, Phaser rouvrirait la Sandbox avec celles du dernier niveau édité
        addTextButton(this, 0, 0, "Nouveau niveau", () => this.scene.start('Sandbox', {}), { color: '#ae9600' });

        const levels = await loadLevels();
        levels.forEach((level, i) => {
            const y = i * 30 + 30;
            const date = new Date(level.datetime);
            const label = level.id.slice(0, 8) + " - " + date.toLocaleDateString() + " " + date.toLocaleTimeString();
            if (!isPlayable(level)) {
                // Sans départ ou sans arrivée : non jouable
                addText(this, 0, y, label + " (incomplet)", { color: '#666666' });
                return;
            }
            addTextButton(this, 100, y, label, () => this.scene.start('Niveau', { level_id: level.id }));
            addTextButton(this, 0, y, "Éditer", () => this.scene.start('Sandbox', { level }), { color: '#ae9600' });
        });
    }
}
