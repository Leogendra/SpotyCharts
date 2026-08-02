const div_home = document.querySelector('.home');
const div_game = document.querySelector('.game');

const big_title = document.querySelector('.big-title');
const ui_lang_button = document.querySelector('.slide');
const dataset_radios = document.querySelectorAll('input[name="dataset"]');
const home_button = document.querySelector('.animated-button');

const text_help = document.querySelector('.help');
const text_score = document.querySelector('.nb-score');
const text_best = document.querySelector('.nb-best');

const firstCardFollowers = document.querySelector('.card.choice:nth-child(1) .card-followers');
const secondCardFollowers = document.querySelector('.card.choice:nth-child(3) .card-followers');

var speed = false;
var record = 0;

var uiLang = localStorage.getItem('uiLang') ?? (navigator.language.startsWith('fr') ? 'fr' : 'en');
var datasetLang = localStorage.getItem('datasetLang') ?? 'en';
const recordKey = () => `record-monthlyListeners-${datasetLang}`;




function refresh_record_display() {
    record = Number(localStorage.getItem(recordKey()) ?? 0);
    text_best.textContent = record;
}


window.addEventListener("load", function () {
    apply_translations();
    ui_lang_button.checked = (uiLang === 'fr');
    dataset_radios.forEach(r => { r.checked = (r.value === datasetLang); });
    set_last_update(`/data/artists_${datasetLang}.json`);
});


home_button.addEventListener("click", async (event) => {
    event.preventDefault();

    refresh_record_display();

    const inner_button = document.querySelector('.inner-button');
    inner_button.classList.add('start-animation');
    inner_button.textContent = "";

    await delay(1000);

    div_home.style.display = "none";
    div_game.style.display = "flex";
    inner_button.classList.remove('start-animation');
    inner_button.textContent = t('play');
    play();
});


// speedrun mode toggle
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


// UI language switch
ui_lang_button.addEventListener("change", () => {
    uiLang = ui_lang_button.checked ? 'fr' : 'en';
    localStorage.setItem('uiLang', uiLang);
    apply_translations();
});


// dataset switch (world top / french top)
dataset_radios.forEach(radio => {
    radio.addEventListener('change', e => {
        datasetLang = e.target.value;
        localStorage.setItem('datasetLang', datasetLang);
        set_last_update(`/data/artists_${datasetLang}.json`);
        refresh_record_display();
    });
});


// toggle between artist name and most famous song
text_help.addEventListener("click", async (event) => {
    const artistCards = document.querySelectorAll('.card-artist');
    const songCards = document.querySelectorAll('.card-song');

    artistCards.forEach(card => card.style.display = "none");
    songCards.forEach(card => card.style.display = "block");

    await delay(3000);

    songCards.forEach(card => card.style.display = "none");
    artistCards.forEach(card => card.style.display = "block");
});



async function set_last_update(file_name) {
    const artistData = await load_and_parse_JSON(file_name);
    const maj_date = document.querySelector('.maj-date');
    let mostRecentDate = new Date(artistData[0].lastUpdate * 1000);

    for (let i = 0; i < artistData.length; i++) {
        let date = new Date(artistData[i].lastUpdate * 1000);
        if (date > mostRecentDate) {
            mostRecentDate = date;
        }
    }

    const locale = uiLang === 'fr' ? 'fr-FR' : 'en-US';
    maj_date.textContent = mostRecentDate.toLocaleDateString(locale, { day: 'numeric', month: 'numeric', year: 'numeric' });
}


/***************** LOADING FUNCTIONS *****************/

async function get_artist() {
    try {
        return await load_and_parse_JSON(`/data/artists_${datasetLang}.json`);
    }
    catch (error) {
        throw new Error("Une erreur s'est produite lors de la récupération des données d'artiste :" + error.message);
    }
}


// Update card display
async function updateCardWithArtistsInfo(artist, numCard) {
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
    cardFollowers.textContent = numCard == 1
        ? format_number(artist.monthlyListeners)
        : "??? ??? ???";

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


async function reveal_number(artist) {
    const targetNumber = artist.monthlyListeners;
    const durationMs = speed ? 1000 : Math.floor(Math.random() * (4000 - 2000)) + 2000;
    const updateInterval = 20; // in ms
    const steps = durationMs / updateInterval;
    const stepValue = targetNumber / steps;

    let currentNumber = 0;
    const interval = setInterval(() => {
        currentNumber += stepValue;
        if (currentNumber >= targetNumber) {
            clearInterval(interval);
            currentNumber = targetNumber;
        }
        secondCardFollowers.textContent = format_number(Math.floor(currentNumber));
    }, updateInterval);

    await delay(durationMs);
}




/***************** GAME FUNCTION *****************/

async function play() {
    text_help.innerHTML = t('helpMonthly');

    const artists = await get_artist();
    shuffle_array(artists);
    let artist_counter = 0;
    let artist1;
    let artist2 = artists[artist_counter % artists.length];
    let win = true;

    while (win) {
        text_score.textContent = artist_counter;

        if (artist_counter > record) {
            record = artist_counter;
            localStorage.setItem(recordKey(), record);
            text_best.textContent = record;
        }

        artist_counter++;
        artist1 = artist2;
        artist2 = artists[artist_counter % artists.length];

        updateCardWithArtistsInfo(artist1, 1);
        updateCardWithArtistsInfo(artist2, 3);

        const clickCard = document.querySelectorAll('.card');
        const votePromise = new Promise(resolve => {
            clickCard.forEach(btn => {
                btn.addEventListener('click', () => {
                    resolve(btn.dataset.vote);
                });
            });
        });
        const vote = await votePromise;

        await reveal_number(artist2);

        const n1 = artist1.monthlyListeners;
        const n2 = artist2.monthlyListeners;

        if (vote == 1) {
            if (n1 >= n2) {
                firstCardFollowers.style.color = "#1fd760";
            }
            else {
                firstCardFollowers.style.color = "red";
                win = false;
            }
        }
        else if (vote == 2) {
            if (n1 <= n2) {
                secondCardFollowers.style.color = "#1fd760";
            }
            else {
                secondCardFollowers.style.color = "red";
                win = false;
            }
        }

        await delay(speed ? 1500 : 3000);
        firstCardFollowers.style.color = "white";
        secondCardFollowers.style.color = "white";
    }

    div_home.style.display = "flex";
    div_game.style.display = "none";
}
