const div_home = document.querySelector('.home');
const div_game = document.querySelector('.game');

const big_title = document.querySelector('.big-title');
const language_button = document.querySelector('.slide');
const all_modes = document.querySelectorAll('input[name="select"]');
const home_button = document.querySelector('.animated-button');

const text_help = document.querySelector('.help');
const text_help_span = document.querySelector('.help .gras');
const text_score = document.querySelector('.nb-score');
const text_best = document.querySelector('.nb-best');

const firstCardFollowers = document.querySelector('.card.choice:nth-child(1) .card-followers');
const secondCardFollowers = document.querySelector('.card.choice:nth-child(3) .card-followers');

var mode = "monthlyListeners";
var language = "en";
var speed = false;
var record = 0;


window.addEventListener("load", function() {
    setLastUpdate("../data/data_en.json");
});


home_button.addEventListener("click", async (event) => {
    event.preventDefault();

    if (localStorage.getItem("record-followers-en") != null) {

        if (mode == "followers") { record = localStorage.getItem("record-followers-" + language); }
        else if (mode == "monthlyListeners") { record = localStorage.getItem("record-monthlyListeners-" + language); }
        else { record = localStorage.getItem("record-worldRank-" + language); }

        text_best.textContent = record;
    }
    else {
        text_best.textContent = "0";
        localStorage.setItem("record-followers-en", 0);
        localStorage.setItem("record-monthlyListeners-en", 0);
        localStorage.setItem("record-worldRank-en", 0);
        localStorage.setItem("record-followers-fr", 0);
        localStorage.setItem("record-monthlyListeners-fr", 0);
        localStorage.setItem("record-worldRank-fr", 0);
    }

    const inner_button = document.querySelector('.inner-button');
    inner_button.classList.add('start-animation');
    inner_button.textContent = ""

    await delay(1000);

    div_home.style.display = "none";
    div_game.style.display = "flex";
    inner_button.classList.remove('start-animation');
    inner_button.textContent = "Jouer"
    play();
});


// activation du mode speedrun
big_title.addEventListener("click", async (event) => {
    const rotating_img = document.querySelector('.rotating-image img');
    if (speed) {
        speed = false;
        rotating_img.style.animation = 'rotateImage 10s linear infinite';
        console.log("speedrun désactivé");
    }
    else {
        speed = true;
        rotating_img.style.animation = 'rotateImage 2s linear infinite';
        console.log("speedrun activé");
    }
});


// changement de langue
language_button.addEventListener("click", async (event) => {
    if (language == "en") { 
        language = "fr"; 
        setLastUpdate("../data/data_fr.json");
    }
    else { 
        language = "en"; 
        setLastUpdate("../data/data_en.json");
    }
});


// choix du mode
all_modes.forEach(radioButton => {
    radioButton.addEventListener('change', event => {
        const selectedValue = event.target.value;
        if (selectedValue == 1) {
            mode = "followers";
        }
        else if (selectedValue == 2) {
            mode = "monthlyListeners";
        }
        else {
            mode = "worldRank";
        }
    });
});


// changement de l'artiste/son le plus connu
text_help.addEventListener("click", async (event) => {
    const artistCards = document.querySelectorAll('.card-artist');
    const songCards = document.querySelectorAll('.card-song');

    console.log("Changement de l'artiste/son le plus connu");

    artistCards.forEach(card => card.style.display = "none");
    songCards.forEach(card => card.style.display = "block");

    await delay(3000);

    songCards.forEach(card => card.style.display = "none");
    artistCards.forEach(card => card.style.display = "block");
});



async function setLastUpdate(file_name) {
    const artistData = await loadAndParseJSON(file_name);
    const maj_date = document.querySelector('.maj-date');
    let mostRecentDate = new Date(artistData[0].lastUpdate);

    for (let i = 0; i < artistData.length; i++) {
        let date = new Date(artistData[i].lastUpdate * 1000);
        if (date > mostRecentDate) {
            mostRecentDate = date;
        }
    }

    maj_date.textContent = mostRecentDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric', year: 'numeric' });
}


/***************** FONCTIONS DE CHARGEMENT *****************/

async function getArtist() {
    try {
        if (language == "en") {
            const artistData = await loadAndParseJSON("../data/data_en.json");
            return artistData;
        }
        else {
            const artistData = await loadAndParseJSON("../data/data_fr.json");
            return artistData;
        }
    }
    catch (error) {
        throw new Error('Une erreur s\'est produite lors de la récupération des données d\'artiste :' + error.message);
    }
}


function getNumberToDisplay(artist, mode) {
    let nbToDisplay;

    if (mode == "followers") {
        nbToDisplay = artist.followers;
        text_help.innerHTML = "Qui a le plus <span class='gras souligne'>de followers</span> ?";
    }
    else if (mode == "monthlyListeners") {
        nbToDisplay = artist.monthlyListeners;
        text_help.innerHTML = "Qui a le plus <span class='gras souligne'>d'auditeurs mensuels</span> ?";
    }
    else {
        nbToDisplay = artist.worldRank;
        text_help.innerHTML = "Qui est le <span class='gras souligne'>mieux classé</span> ?";
    }

    return nbToDisplay;
}



// Mise à jour de l'affichage des cartes
async function updateCardWithArtistsInfo(artist, numCard, mode) {
    const card = document.querySelector(`.card:nth-child(${numCard})`);

    const cardImg = card.querySelector('.card-img');
    cardImg.src = artist.avatarImage;
    const cardImgWide = card.querySelector('.card-img-wide');
    if (artist.headerImage != null) {
        cardImgWide.src = artist.headerImage;
    }
    else {
        cardImgWide.src = artist.avatarImage;
    }


    const cardArtist = card.querySelector('.card-artist');
    cardArtist.textContent = artist.name;

    // Nb followers
    const cardFollowers = card.querySelector('.card-followers');
    let stringToDisplay;
    if (numCard == 1) {
        if (mode == "worldRank") { stringToDisplay = "Top " + getNumberToDisplay(artist, mode); }
        else { stringToDisplay = formatNumber(getNumberToDisplay(artist, mode)); }
    }
    else {
        if (mode == "worldRank") { stringToDisplay = "Top ???"; }
        else { stringToDisplay = "??? ??? ???"; }
    }
    cardFollowers.textContent = stringToDisplay;

    // Most famous song
    let songWithHighestPlaycount = null;
    let highestPlaycount = 0;

    artist.topSongs.forEach(song => {
        const playcount = parseInt(song.playcount);
        if (playcount > highestPlaycount) {
            highestPlaycount = playcount;
            songWithHighestPlaycount = song;
        }
    });

    if (songWithHighestPlaycount != null) {
        const cardSong = card.querySelector('.card-song');
        cardSong.textContent = songWithHighestPlaycount.name;
    }
}


async function revealNumber(artist, mode) {
    let targetNumber = getNumberToDisplay(artist, mode);
    let durationMs;
    if (speed) {
        durationMs = 1000;
    }
    else {
        durationMs = Math.floor(Math.random() * (4000 - 2000)) + 2000;
    }
    const updateInterval = 20; // en ms
    const steps = durationMs / updateInterval;
    const stepValue = targetNumber / steps;

    let currentNumber = 0;
    if (mode == "worldRank") {
        const interval = setInterval(() => {
            currentNumber += stepValue;
            if (currentNumber >= targetNumber) {
                clearInterval(interval);
                currentNumber = targetNumber;
            }
            secondCardFollowers.textContent = "Top " + Math.floor(currentNumber);
        }, updateInterval);
    }
    else {
        const interval = setInterval(() => {
            currentNumber += stepValue;
            if (currentNumber >= targetNumber) {
                clearInterval(interval);
                currentNumber = targetNumber;
            }
            secondCardFollowers.textContent = formatNumber(Math.floor(currentNumber));
        }, updateInterval);
    }

    // Attendre la fin de l'animation
    await delay(durationMs);
}




/***************** FONCTION DE JEU *****************/

async function play() {
    const artists = await getArtist();
    shuffleArray(artists);
    let artist_counter = 0;
    let artist1;
    let artist2 = artists[artist_counter % artists.length];
    let win = true;

    while (win) {
        // Update des scores
        text_score.textContent = artist_counter;

        if (artist_counter > record) {
            record = artist_counter;
            if (language == "en") {
                if (mode == "followers") { localStorage.setItem("record-followers-en", record); }
                else if (mode == "monthlyListeners") { localStorage.setItem("record-monthlyListeners-en", record); }
                else { localStorage.setItem("record-worldRank-en", record); }
            }
            else {
                if (mode == "followers") { localStorage.setItem("record-followers-fr", record); }
                else if (mode == "monthlyListeners") { localStorage.setItem("record-monthlyListeners-fr", record); }
                else { localStorage.setItem("record-worldRank-fr", record); }
            }
            text_best.textContent = record;
        }

        // récupérer un second artiste aléatoire
        artist_counter++;
        artist1 = artist2;
        artist2 = artists[artist_counter % artists.length];

        // mettre les deux cards
        updateCardWithArtistsInfo(artist1, 1, mode);
        updateCardWithArtistsInfo(artist2, 3, mode);

        // attend que l'utilisateur clique sur l'un des deux boutons de vote
        const clickCard = document.querySelectorAll('.card');
        const votePromise = new Promise(resolve => {
            clickCard.forEach(btn => {
                btn.addEventListener('click', () => {
                    resolve(btn.dataset.vote);
                });
            });
        });
        const vote = await votePromise;

        // affichage des followers
        await revealNumber(artist2, mode);

        //check si réussi ou pas
        const numberToDisplay1 = getNumberToDisplay(artist1, mode);
        const numberToDisplay2 = getNumberToDisplay(artist2, mode);

        if (mode === "worldRank") {
            if (vote == 1) {
                if (numberToDisplay1 <= numberToDisplay2) {
                    firstCardFollowers.style.color = "#1fd760";
                }
                else {
                    firstCardFollowers.style.color = "red";
                    win = false;
                }
            }
            else if (vote == 2) {
                if (numberToDisplay1 >= numberToDisplay2) {
                    secondCardFollowers.style.color = "#1fd760";
                }
                else {
                    secondCardFollowers.style.color = "red";
                    win = false;
                }
            }
        }
        else {
            if (vote == 1) {
                if (numberToDisplay1 >= numberToDisplay2) {
                    firstCardFollowers.style.color = "#1fd760";
                }
                else {
                    firstCardFollowers.style.color = "red";
                    win = false;
                }
            }
            else if (vote == 2) {
                if (numberToDisplay1 <= numberToDisplay2) {
                    secondCardFollowers.style.color = "#1fd760";
                }
                else {
                    secondCardFollowers.style.color = "red";
                    win = false;
                }
            }
        }



        if (speed) {
            await delay(1500);
        }
        else {
            await delay(3000);
        }
        firstCardFollowers.style.color = "white";
        secondCardFollowers.style.color = "white";
    }

    div_home.style.display = "flex";
    div_game.style.display = "none";
}
