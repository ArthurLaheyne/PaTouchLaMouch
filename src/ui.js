// Éléments d'interface communs aux scènes

const TEXT_STYLE = { fontFamily: 'Arial Black', fontSize: 20, color: '#000000' };

// Grossit légèrement au survol
export function zoomOnHover(scene, target) {
    const zoom = scale => scene.tweens.add({ targets: target, scaleX: scale, scaleY: scale, duration: 200, ease: 'Linear' });
    target.on('pointerover', () => zoom(1.1));
    target.on('pointerout', () => zoom(1));
    return target;
}

// Bouton image (coin supérieur droit : x = 755, y = 45, 135, 225...)
export function addButton(scene, x, y, texture, onClick, event = 'pointerdown') {
    const button = scene.add.image(x, y, texture, 0).setOrigin(0.5, 0.5).setInteractive();
    button.on(event, onClick);
    return zoomOnHover(scene, button);
}

export function addFullscreenButton(scene, x = 755, y = 45) {
    const button = addButton(scene, x, y, 'fullscreen', () => {
        if (scene.scale.isFullscreen) {
            button.setFrame(0);
            scene.scale.stopFullscreen();
        } else {
            button.setFrame(1);
            scene.scale.startFullscreen();
        }
    }, 'pointerup');
    return button;
}

// Bouton texte ; style complété par TEXT_STYLE
export function addTextButton(scene, x, y, label, onClick, style = {}, origin = [0, 0]) {
    const text = scene.add.text(x, y, label, { ...TEXT_STYLE, ...style }).setOrigin(...origin).setInteractive();
    text.on('pointerdown', onClick);
    return zoomOnHover(scene, text);
}

export function addText(scene, x, y, label, style = {}) {
    return scene.add.text(x, y, label, { ...TEXT_STYLE, ...style });
}

// Fond d'écran étiré sur tout le canvas
export function addBackground(scene, texture = 'ocean') {
    const background = scene.add.image(0, 0, texture).setOrigin(0, 0);
    background.displayWidth = scene.sys.canvas.width;
    background.displayHeight = scene.sys.canvas.height;
    return background;
}

// Message temporaire en bas de l'écran (un seul à la fois)
export function showMessage(scene, text, color = '#000000') {
    if (scene.messageText) scene.messageText.destroy();
    const message = addText(scene, 400, 570, text, { color }).setOrigin(0.5).setDepth(100);
    scene.messageText = message;
    scene.time.delayedCall(4000, () => {
        if (scene.messageText === message) {
            message.destroy();
            scene.messageText = null;
        }
    });
}
