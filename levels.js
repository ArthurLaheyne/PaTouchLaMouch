// Chargement des niveaux.
//
// - levels.json : niveaux officiels, versionnés dans git et déployés (ex. "niveau-1", lancé par « Click to Start »)
// - data/levels.json : niveaux créés ou modifiés en ligne via save-level.php (uniquement sur le serveur,
//   jamais écrasé par le déploiement)
// Les deux listes sont fusionnées ; un niveau officiel modifié dans l'éditeur (même id dans data/levels.json)
// remplace la version officielle.

async function fetchLevels(url) {
    try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error(url, error.message);
    }
    return [];
}

export async function loadLevels() {
    const [official, online] = await Promise.all([fetchLevels("levels.json"), fetchLevels("data/levels.json")]);
    const onlineById = new Map(online.map(level => [level.id, level]));
    const merged = official.map(level => onlineById.get(level.id) || level);
    const officialIds = new Set(official.map(level => level.id));
    return [...merged, ...online.filter(level => !officialIds.has(level.id))];
}

export function isPlayable(level) {
    const json = level?.json || {};
    return json.start?.lines?.length > 0 && json.end?.lines?.length > 0;
}
