export class MainMenu extends Phaser.Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        //  Get the current highscore from the registry
        const score = this.registry.get('highscore');

        const textStyle = { fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff', stroke: '#000000', strokeThickness: 8 };

        this.background = this.add.image(0, 0, 'background').setOrigin(0, 0);
        this.background.displayWidth = this.sys.canvas.width;
        this.background.displayHeight = this.sys.canvas.height;

        const logo = this.add.image(400, 200, 'patouchlamouch');

        this.tweens.add({
            targets: logo,
            y: 220,
            duration: 1000,
            ease: 'Bounce'
        });

        const clickStartText = [
            "Click to Start!"
        ]
        this.clickStart = this.add.text(400, 450, clickStartText, textStyle).setAlign('center').setOrigin(0.5).setInteractive();
        this.clickStart.on('pointerdown', () => {
            this.scene.start('Game');
            this.scale.startFullscreen();
        });
        this.clickStart.on('pointerover', () => {
            this.tweens.add({
                targets: this.clickStart,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200,
                ease: 'Linear'
            });
        });
        this.clickStart.on('pointerout', () => {
            this.tweens.add({
                targets: this.clickStart,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Linear'
            });
        });

        const mode_sandbox = [
            "Mode Sandbox"
        ]
        this.modeSandbox = this.add.text(400, 500, mode_sandbox, textStyle).setAlign('center').setOrigin(0.5).setInteractive()
        this.modeSandbox.on('pointerover', () => {
            this.tweens.add({
                targets: this.modeSandbox,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200,
                ease: 'Linear'
            });
        });
        this.modeSandbox.on('pointerout', () => {
            this.tweens.add({
                targets: this.modeSandbox,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Linear'
            });
        });
        this.modeSandbox.on('pointerdown', () => {
            this.scene.start('Sandbox');
            this.scale.startFullscreen();
        });

        const mode_niveaux = [
            "Niveaux"
        ]
        this.modeNiveaux = this.add.text(400, 550, mode_niveaux, textStyle).setAlign('center').setOrigin(0.5).setInteractive()
        this.modeNiveaux.on('pointerover', () => {
            this.tweens.add({
                targets: this.modeNiveaux,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200,
                ease: 'Linear'
            });
        });
        this.modeNiveaux.on('pointerout', () => {
            this.tweens.add({
                targets: this.modeNiveaux,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Linear'
            });
        });
        this.modeNiveaux.on('pointerdown', () => {
            this.scene.start('Niveaux');
            this.scale.startFullscreen();
        });
    }
}