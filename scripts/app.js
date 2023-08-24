const div_home = document.querySelector('.home');
const div_game = document.querySelector('.game');

const big_title = document.querySelector('.big-title');
const home_button = document.querySelector('.animated-button');
const all_modes = document.querySelectorAll('input[name="select"]');

const text_help = document.querySelector('.help');
const text_help_span = document.querySelector('.help .gras');
const text_score = document.querySelector('.nb-score');
const text_best = document.querySelector('.nb-best');

const firstCardFollowers = document.querySelector('.card.choice:nth-child(1) .card-followers');
const secondCardFollowers = document.querySelector('.card.choice:nth-child(3) .card-followers');

var mode = "monthlyListeners";
var speed = false;
var record = 0;


home_button.addEventListener("click", async (event) => {
    event.preventDefault();

    if (localStorage.getItem("record-followers") != null) {
        if (mode == "followers") {record = localStorage.getItem("record-followers");}
        else if (mode == "monthlyListeners") {record = localStorage.getItem("record-monthlyListeners");}
        else {record = localStorage.getItem("record-worldRank");}
        text_best.textContent = record;
    }
    else {
        text_best.textContent = "0";
        localStorage.setItem("record-followers", 0);
        localStorage.setItem("record-monthlyListeners", 0);
        localStorage.setItem("record-worldRank", 0);
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


async function getArtist() {
    try {
        const artistData = await loadAndParseJSON("../data/data.json");
        return artistData;
    } 
    catch (error) {
        throw new Error('Une erreur s\'est produite lors de la récupération des données d\'artiste :' + error.message);
    }
}


function getNumberToDisplay(artist, mode) {
    let nbToDisplay;

    if (mode == "followers") {
        nbToDisplay = artist.followers;
        text_help.innerHTML = "Qui a le plus <span class='gras'>de followers</span> ?";
    }
    else if (mode == "monthlyListeners") {
        nbToDisplay = artist.monthlyListeners;
        text_help.innerHTML = "Qui a le plus <span class='gras'>d'auditeurs mensuels</span> ?";
    }
    else {
        nbToDisplay = artist.worldRank;
        text_help.innerHTML = "Qui est le <span class='gras'>mieux classé</span> ?";
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

    const cardFollowers = card.querySelector('.card-followers');
    let stringToDisplay;
    if (numCard == 1) {
        if (mode == "worldRank") {
            stringToDisplay = "Top " + getNumberToDisplay(artist, mode);
        }
        else {
            stringToDisplay = formatNumber(getNumberToDisplay(artist, mode));
        }
    }
    else {
        if (mode == "worldRank") {
            stringToDisplay = "Top ???";
        }
        else {
            stringToDisplay = "??? ??? ???";
        }
        
    }
    cardFollowers.textContent = stringToDisplay;
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
            if (mode == "followers") {localStorage.setItem("record-followers", record);}
            else if (mode == "monthlyListeners") {localStorage.setItem("record-monthlyListeners", record);}
            else {localStorage.setItem("record-worldRank", record);}
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
                if (numberToDisplay1 < numberToDisplay2) {
                    firstCardFollowers.style.color = "#1fd760";
                } 
                else {
                    firstCardFollowers.style.color = "red";
                    win = false;
                }
            } 
            else if (vote == 2) {
                if (numberToDisplay1 > numberToDisplay2) {
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
                if (numberToDisplay1 > numberToDisplay2) {
                    firstCardFollowers.style.color = "#1fd760";
                } 
                else {
                    firstCardFollowers.style.color = "red";
                    win = false;
                }
            } 
            else if (vote == 2) {
                if (numberToDisplay1 < numberToDisplay2) {
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
