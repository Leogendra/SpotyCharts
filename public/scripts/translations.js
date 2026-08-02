const translations = {
    fr: {
        lastUpdate: "Dernière MàJ des artistes :",
        play: "Jouer",
        record: "Record :",
        topWorld: "Artistes du monde",
        topFrance: "Artistes français",
        helpMonthly: "<span class='qui gras'>Qui</span> a le plus d'auditeurs mensuels ?",
    },
    en: {
        lastUpdate: "Artists last update:",
        play: "Play",
        record: "Best:",
        topWorld: "World artists",
        topFrance: "French artists",
        helpMonthly: "<span class='qui gras'>Who</span> has the most monthly listeners?",
    },
};




function t(key) {
    return translations[uiLang]?.[key] ?? key;
}


function apply_translations() {
    document.querySelectorAll("[data-translations]").forEach((el) => {
        el.textContent = t(el.dataset.translations);
    });
    document.querySelectorAll("[data-translations-html]").forEach((el) => {
        el.innerHTML = t(el.dataset.translationsHtml);
    });
}


// when loading page
document.addEventListener("DOMContentLoaded", () => {
    apply_translations();
});