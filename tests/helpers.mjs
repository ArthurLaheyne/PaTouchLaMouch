// Outils communs aux tests : serveur PHP sur une copie du projet, navigateur piloté par Playwright.
//
// Lancer les tests : npm test
// En local, pour utiliser le Chrome installé au lieu de celui de Playwright :
//   CHROME_PATH=/usr/bin/google-chrome npm test
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

export const PASSWORD = 'secret';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function freePort() {
    return new Promise(resolve => {
        const server = createServer();
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
    });
}

// Copie les fichiers du projet connus de git (suivis ou nouveaux, sans les fichiers ignorés comme data/)
// dans un dossier temporaire et lance `php -S` dessus
export async function startServer() {
    const dir = mkdtempSync(join(tmpdir(), 'patouch-test-'));
    const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: ROOT }).toString().split('\0').filter(Boolean);
    for (const file of files) {
        mkdirSync(join(dir, dirname(file)), { recursive: true });
        try {
            copyFileSync(join(ROOT, file), join(dir, file));
        } catch {
            // fichier supprimé localement mais pas encore commité
        }
    }
    // Même génération que la CI (var_export : le hash contient des $ qu'il ne faut pas laisser interpréter par PHP)
    const config = execFileSync('php', ['-r', 'echo "<?php\\nreturn [\'password_hash\' => " . var_export(password_hash($argv[1], PASSWORD_DEFAULT), true) . "];\\n";', PASSWORD]).toString();
    writeFileSync(join(dir, 'save-level.config.php'), config);
    const port = await freePort();
    const php = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', dir], { stdio: 'ignore' });
    const url = `http://127.0.0.1:${port}/`;
    for (let i = 0; i < 50; i++) {
        try {
            if ((await fetch(url + 'levels.json')).ok) break;
        } catch {
            // pas encore prêt
        }
        await new Promise(r => setTimeout(r, 100));
    }
    return {
        url,
        dir,
        stop() {
            php.kill();
            rmSync(dir, { recursive: true, force: true });
        },
    };
}

export async function api(url, body) {
    const response = await fetch(url + 'save-level.php', { method: 'POST', body: JSON.stringify({ password: PASSWORD, ...body }) });
    return { status: response.status, body: await response.json() };
}

export async function onlineLevels(url) {
    const response = await fetch(url + 'data/levels.json', { cache: 'no-store' });
    return response.ok ? response.json() : [];
}

// Ouvre le jeu (instance Phaser exposée dans window.game) et attend le menu
export async function openGame(url) {
    const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => (d.type() === 'prompt' ? d.accept(PASSWORD) : d.accept()));
    await page.route('**/game-niveau1.html', async route => {
        const response = await route.fetch();
        const body = (await response.text()).replace('var game = new Phaser.Game(config);', 'var game = new Phaser.Game(config); window.game = game;');
        route.fulfill({ response, body });
    });
    await page.goto(url + 'game-niveau1.html');
    await page.waitForFunction(() => window.game && game.scene.isActive('MainMenu') && !game.scene.isActive('Preloader'), null, { timeout: 30000 });
    await page.waitForTimeout(300);
    const box = await page.evaluate(() => {
        const r = game.canvas.getBoundingClientRect();
        return { x: r.left, y: r.top, s: r.width / 800 };
    });
    const at = (x, y) => [box.x + x * box.s, box.y + y * box.s];

    const game = {
        browser,
        page,
        errors,
        async close() {
            await browser.close();
        },
        // Démarre une scène (ou la redémarre si elle tourne déjà) et attend qu'elle soit prête
        async startScene(key, data) {
            await page.evaluate(([key, data]) => {
                const scene = game.scene.getScene(key);
                if (scene.sys.isActive()) {
                    scene.gameOver = undefined;
                    scene.scene.restart(data);
                } else {
                    game.scene.getScenes(true).forEach(s => s.scene.stop());
                    game.scene.start(key, data);
                }
            }, [key, data]);
            if (key === 'Niveau') {
                await page.waitForFunction(() => {
                    const s = game.scene.getScene('Niveau');
                    return s.sys.isActive() && s.player && s.player.body && s.gameOver === false;
                }, null, { timeout: 15000 });
            } else {
                await page.waitForFunction(k => game.scene.isActive(k), key, { timeout: 15000 });
            }
            await page.waitForTimeout(500);
        },
        async click(x, y) {
            await page.mouse.move(...at(x, y));
            await page.mouse.down();
            await page.mouse.up();
            await page.waitForTimeout(150);
        },
        async drag(points, steps = 15) {
            await page.mouse.move(...at(...points[0]));
            await page.mouse.down();
            await page.waitForTimeout(50);
            for (let k = 1; k < points.length; k++) {
                const [fx, fy] = points[k - 1], [tx, ty] = points[k];
                for (let i = 1; i <= steps; i++) {
                    await page.mouse.move(...at(fx + (tx - fx) * i / steps, fy + (ty - fy) * i / steps));
                    await page.waitForTimeout(15);
                }
            }
            await page.mouse.up();
            await page.waitForTimeout(250);
        },
        async key(code) {
            await page.keyboard.press(code);
            await page.waitForTimeout(100);
        },
        // Jeu : clique sur un objet (nom, 'arrivee' ou position) et attend que le joueur soit arrêté
        async play(target) {
            await page.evaluate(target => {
                const s = game.scene.getScene('Niveau');
                const object = target === 'arrivee' ? s.arrivee
                    : typeof target === 'string' ? s.objects.find(o => o.name === target)
                    : s.objects.find(o => o.active && Math.abs(o.x - target[0]) < 1 && Math.abs(o.y - target[1]) < 1);
                object.emit('pointerdown');
            }, target);
            await page.waitForTimeout(300);
            await page.waitForFunction(() => game.scene.getScene('Niveau').player.body.speed === 0, null, { timeout: 30000 });
            await page.waitForTimeout(200);
            return this.playState();
        },
        playState() {
            return page.evaluate(() => {
                const s = game.scene.getScene('Niveau');
                const portals = s.objects.filter(o => o.constructor.name === 'Teleporteur' && o.active);
                return {
                    x: Math.round(s.player.x), y: Math.round(s.player.y),
                    lines: s.player.lines.map(l => l.name).sort(),
                    gameOver: s.gameOver,
                    portals: portals.length,
                };
            });
        },
    };
    return game;
}
