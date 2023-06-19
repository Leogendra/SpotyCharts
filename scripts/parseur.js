async function loadAndParseJSON(fichier) {
    try {
        const response = await fetch(fichier);
        const jsonData = await response.json();

        if (Array.isArray(jsonData)) {
            const dictionaryArray = [];
            jsonData.forEach(item => {
                topSongs = []
                item.topSongs.forEach(song => {
                    topSongs.push({
                        id: song.track.id,
                        name: song.track.name,
                        playcount: song.track.playcount,
                    });
                });
                artiste = {
                    id: item.id,
                    name: item.name,
                    lastUpdate: item.lastUpdate.seconds,
                    followers: item.stats.followers,
                    worldRank: item.stats.worldRank,
                    monthlyListeners: item.stats.monthlyListeners,
                    avatarImage: item.images.avatarImage?.sources[0].url,
                    headerImage: item.images.headerImage?.sources[0].url,
                    topSongs: topSongs,
                }
                dictionaryArray.push(artiste);
            });
            return dictionaryArray;
        } else {
            console.error('Le fichier JSON est incorrect.');
        }
    } 
    catch (error) {
        console.error('Une erreur s\'est produite lors du chargement du JSON :', error);
    }
}