// Chargement des niveaux.
//
// - data/levels.json : niveaux enregistrés depuis la Sandbox via save-level.php (uniquement sur le serveur,
//   jamais écrasé par le déploiement)
// - levels.json : niveaux versionnés dans git (repli si data/levels.json n'existe pas encore, ex. en local)
const SOURCES = ["data/levels.json", "levels.json"];

export async function loadLevels() {
    for (const url of SOURCES) {
        try {
            const response = await fetch(url, { cache: "no-store" });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error(url, error.message);
        }
    }
    console.error("Aucun fichier de niveaux n'a pu être chargé");
    return [];
}

export function isPlayable(level) {
    const json = level?.json || {};
    return json.start?.lines?.length > 0 && json.end?.lines?.length > 0;
}
