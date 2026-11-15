import { Boot } from './scenes/Boot.js';
import { Preloader } from './scenes/Preloader.js';
import { MainMenu } from './scenes/MainMenu.js';
import { Niveaux } from './scenes/Niveaux.js';
import { Niveau } from './scenes/Niveau.js';
import { Sandbox } from './scenes/Sandbox.js';

const config = {
    type: Phaser.AUTO,
    scale: {
        parent: 'phaser-example',
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
    },
    physics: {
        default: 'arcade',
    },
    scene: [Boot, Preloader, MainMenu, Niveaux, Niveau, Sandbox],
};

// Instance exposée pour le débogage dans la console et pour les tests (tests/)
window.game = new Phaser.Game(config);
