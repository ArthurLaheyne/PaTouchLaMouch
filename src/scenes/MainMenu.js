import { addBackground, addTextButton } from '../ui.js';

export class MainMenu extends Phaser.Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const style = { fontSize: 38, color: '#ffffff', stroke: '#000000', strokeThickness: 8, align: 'center' };

        addBackground(this, 'background');
        const logo = this.add.image(400, 200, 'patouchlamouch');
        this.tweens.add({ targets: logo, y: 220, duration: 1000, ease: 'Bounce' });

        addTextButton(this, 400, 450, "Click to Start!", () => {
            // Niveau 1 : niveau officiel de levels.json
            this.scene.start('Niveau', { level_id: 'niveau-1', backTo: 'MainMenu' });
            this.scale.startFullscreen();
        }, style, [0.5, 0.5]);

        addTextButton(this, 400, 500, "Mode Sandbox", () => {
            this.scene.start('Niveaux');
            this.scale.startFullscreen();
        }, style, [0.5, 0.5]);
    }
}
