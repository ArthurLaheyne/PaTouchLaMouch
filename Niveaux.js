import { loadLevels, isPlayable } from './levels.js';

export class Niveaux extends Phaser.Scene
{
    constructor ()
    {
        super('Niveaux');
    }

    preload() {
    }

    async create()
    {

        const scene = this;
        scene.levels = [];
        
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
        
        const button_back = this.add.image(800 - 45, 135, 'back', 0).setOrigin(0.5, 0.5).setInteractive();
        button_back.on('pointerdown', (event) => {
            this.scene.start('MainMenu');
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

        // Niveaux en fichier depuis l'extinction de l'API AWS, le 2026-11-14 (voir levels.js)
        let levelsData = await loadLevels();
        console.log(levelsData);

        let level_new = scene.add.text(0, 0, "Nouveau niveau", { fontFamily: 'Arial Black', fontSize: 20, color: '#ae9600' }).setAlign('left').setOrigin(0).setInteractive();
        level_new.on('pointerover', () => {
            this.tweens.add({
                targets: level_new,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200,
                ease: 'Linear'
            });
        });
        level_new.on('pointerout', () => {
            this.tweens.add({
                targets: level_new,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Linear'
            });
        });
        level_new.on('pointerdown', () => {
            this.scene.start('Sandbox');
        })
        levelsData.forEach((levelData, key) => {        
            let position = (key * 30) + 30
            let level_id_datetime_text = levelData.id + " - " + new Date(levelData.datetime).toLocaleDateString() + " " + new Date(levelData.datetime).toLocaleTimeString()
            // Un niveau sans départ ou sans arrivée ne peut pas être joué
            if (!isPlayable(levelData)) {
                scene.add.text(0, position, level_id_datetime_text + " (incomplet)", { fontFamily: 'Arial Black', fontSize: 20, color: '#666666' }).setAlign('left').setOrigin(0);
                return;
            }
            let level = scene.add.text(0, position, level_id_datetime_text, { fontFamily: 'Arial Black', fontSize: 20, color: '#000000' }).setAlign('left').setOrigin(0).setInteractive();
            level.on('pointerover', () => {
                this.tweens.add({
                    targets: level,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 200,
                    ease: 'Linear'
                });
            });
            level.on('pointerout', () => {
                this.tweens.add({
                    targets: level,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200,
                    ease: 'Linear'
                });
            });
            level.on('pointerdown', () => {
                this.scene.start('Niveau', { level_id: levelData.id });
            })
            scene.levels.push(level);
        });

    }

    update()
    {
    }
}