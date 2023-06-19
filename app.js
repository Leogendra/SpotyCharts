//Playlist par défaut 
var DEFAULT_PLAYLIST = 'https://open.spotify.com/playlist/73xODtPD7TblyM1BUqLjR3';
var DEFAULT_ALBUM = 'https://open.spotify.com/album/6yiXkzHvC0OTmhfDQOEWtS';

const playlistForm = document.querySelector('.playlist-form');
const playlistInput = document.querySelector('.playlist-id');
const cards = document.querySelector('.card-container');
const errorText = document.querySelector('.error-text');
const scoreButton = document.querySelector('.score-button');
const matchNumber = document.querySelector('.match-number');
var playlistType = "playlists";
var scoreVisible = false;
var transition = false;
var tracks;
var score = {};


// Attends que l'utilisateur entre l'ID d'une playlist
playlistForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  let inputUrl = playlistInput.value.trim().split("?")[0];
  playlistInput.value = inputUrl;

  if (inputUrl == "clear") {
    localStorage.clear();
    playlistInput.value = "";
    errorText.textContent = 'Données locales réinitialisées';
    return;
  }
  else if (inputUrl == "album") {
    inputUrl = DEFAULT_ALBUM;
  }
  

  
  //selection de la playlist par defaut si l'utilisateur n'en entre pas une
  if (inputUrl.length == 0) {
    if (localStorage.getItem("defaultPlaylist") != null) {
      DEFAULT_PLAYLIST = localStorage.getItem("defaultPlaylist");
      playlistInput.placeholder = DEFAULT_PLAYLIST;
    }
    inputUrl = DEFAULT_PLAYLIST;
  }
  
  let playlistId = inputUrl.split('/')[inputUrl.split('/').length-1];
  playlistType = inputUrl.split('/')[inputUrl.split('/').length-2]+"s";
  
  //si les playlist sont deja dans le local storage, on les recupere
  if (localStorage.getItem("tracks"+playlistId) != null) {
    errorText.textContent = "";
    playlistForm.style.display = 'none';
    matchNumber.style.visibility = 'visible';
    cards.style.display = 'flex';
    plays(playlistId);
    return;
  }

  //vérification de l'existence de la playlist
  ACCESS_TOKEN = await getAuthSpotify();
  const playlistUrl = `https://api.spotify.com/v1/${playlistType}/${playlistId}/tracks`;
  const response = await fetch(playlistUrl, {
    headers: {
      Authorization: "Bearer " + ACCESS_TOKEN
    },
  });
  const tracks = await response.json();

  if (response.status !== 200) {
    errorText.textContent = 'URL incorrecte';
    playlistInput.value = "";
  }
  else if (tracks.items.length < 2) {
    errorText.textContent = 'La playlist est trop petite';
    playlistInput.value = "";
  }
  else {
    DEFAULT_PLAYLIST = inputUrl;
    localStorage.setItem("defaultPlaylist", DEFAULT_PLAYLIST);
    playlistInput.placeholder = DEFAULT_PLAYLIST;
    errorText.textContent = "";
    playlistForm.style.display = 'none';
    matchNumber.style.visibility = 'visible';  
    cards.style.display = 'flex';
    plays(playlistId);
  }
});



// Fonction pour récupérer les informations d'une playlist Spotify
async function getPlaylistTrackInfo(playlistId) {
  ACCESS_TOKEN = await getAuthSpotify();
  const playlistResponse = await fetch(`https://api.spotify.com/v1/${playlistType}/${playlistId}`, {
    headers: {
      'Authorization': 'Bearer ' + ACCESS_TOKEN
    }
  });
  const playlistData = await playlistResponse.json();
  let playlistImg = playlistData.images[0].url;
  const tracks = playlistData.tracks.items;
  console.log(`${tracks.length} tracks dans ${playlistType}`);

  
  const trackInfo = await Promise.all(tracks.map(async (track) => {
    if (playlistType == "playlists") {
      if (track.track == null) {return;}
        return {
          uri: track.track.uri,
          name: track.track.name,
          artists: track.track.artists,
          imageUrl: track.track.album.images[0].url,
          songUrl: track.track.external_urls.spotify
        };
      }
      else {
        if (track == null) {return;}
        return {
          uri: track.uri,
          name: track.name,
          artists: track.artists,
          imageUrl: playlistImg,
          songUrl: track.external_urls.spotify
        };
    }
  }));

  return trackInfo;
}




async function titleClicked(numTitle) {
  if (transition) {return;}
  transition = true;
  const card1 = document.querySelector('.card:nth-child(1)');
  const trackUri1 = card1.querySelector('.card-uri').textContent;
  const card2 = document.querySelector('.card:nth-child(2)');
  const trackUri2 = card2.querySelector('.card-uri').textContent;
  card1.classList.remove("choice");
  card2.classList.remove("choice");

  // calcul des scores avec le systeme de classement Elo
  const score1 = score[trackUri1];
  const score2 = score[trackUri2];
  const e1 = 1/(1+10**((score2-score1)/400));
  const e2 = 1/(1+10**((score1-score2)/400));
  const k = 32;
  if (numTitle == 1) {
    score[trackUri1] = score1 + k*(1-e1);
    score[trackUri2] = score2 + k*(0-e2);
    card1.classList.add("slide-left-win");
    card2.classList.add("slide-right-los");
  }
  if (numTitle == 2) {
    score[trackUri1] = score1 + k*(0-e1);
    score[trackUri2] = score2 + k*(1-e2);    
    card1.classList.add("slide-left-los");
    card2.classList.add("slide-right-win");
  }
  else {
    score[trackUri1] = score1 + k*(0.5-e1);
    score[trackUri2] = score2 + k*(0.5-e2);
    card1.classList.add("slide-left-win");
    card2.classList.add("slide-right-win");
  }

  await new Promise(resolve => setTimeout(resolve, 400));
  card1.className = '';
  card2.className = '';
  card1.classList.add("card", "choice");
  card2.classList.add("card", "choice");
  transition = false;
}



// Fonction pour mettre à jour l'affichage des cartes
async function updateCardWithTrackInfo(track, numCard) {
  const card = document.querySelector(`.card:nth-child(${numCard})`);

  const cardImg = card.querySelector('.card-img');
  cardImg.src = track.imageUrl;

  const cardTitle = card.querySelector('.card-title');
  cardTitle.textContent = track.name;

  const cardArtist = card.querySelector('.card-artist');
  cardArtist.textContent = "";
  for (let i = 0; i < track.artists.length; i++) {
    if (i > 0) {
      cardArtist.textContent += ", ";
    }
    cardArtist.textContent += track.artists[i].name;
  }

  const cardUri = card.querySelector('.card-uri');
  cardUri.textContent = track.uri;
}





function toggleScoreView() {
  scoreVisible = !scoreVisible;

  let button = document.querySelector(".score-button");
  if (scoreVisible) {
    // Cacher les cartes
    cards.style.display = "none";

    // Afficher la liste des scores
    const scoreList = document.querySelector(".affichage-scores");
    scoreList.style.display = "block";
    scoreList.innerHTML = "";

    // Tri des tracks par score décroissant
    const sortedTracks = tracks.sort((a, b) => score[b.uri] - score[a.uri]);

    // Création de la liste des musiques triée
    const liste = document.querySelector(".affichage-scores");
    sortedTracks.forEach((track, index) => {
      const li = document.createElement('a');
      // const scoreTrack = Math.round(score[track.uri]);
      let trackString = `${index+1} : ${track.name} - ${track.artists[0].name}`;
      if (track.artists.length > 1) {
        for (let i=1; i < track.artists.length; i++) {
          trackString += `, ${track.artists[i].name}`;
        }
      }
      li.textContent = trackString;
      li.href = track.songUrl;
      li.target = "_blank";

      const liContainer = document.createElement('div');
      liContainer.classList.add("song");
      liContainer.appendChild(li);
      liste.appendChild(liContainer);
    });
    button.textContent = "Match";
  }

  else {
    // Cacher la liste des scores
    const scoreList = document.querySelector(".affichage-scores");
    scoreList.style.display = "none";

    // Afficher les cartes
    cards.style.display = "flex";
    button.textContent = "Scores";
  }
}



function backToMenu() {
  playlistForm.style.display = 'flex';
  
  cards.style.display = 'none';
  matchNumber.style.visibility = 'hidden';
  scoreButton.style.visibility = 'hidden';
  
  const scoreList = document.querySelector(".affichage-scores");
  scoreList.style.display = "none";
  let button = document.querySelector(".score-button");
  button.textContent = "Scores";
  scoreVisible = false;
}






/***************** FONCTION DE JEU *****************/
async function plays(id_playlist) {
  let matchList = [];
  let nbTracks = 0;
  if (localStorage.getItem('tracks'+id_playlist) != null) {
    tracks = JSON.parse(localStorage.getItem('tracks'+id_playlist));
    nbTracks = JSON.parse(localStorage.getItem('nbTracks'+id_playlist));
    matchList = JSON.parse(localStorage.getItem('matchList'+id_playlist));
    score = JSON.parse(localStorage.getItem('score'+id_playlist));
    scoreButton.style.visibility = 'visible';
  }
  else {
    // récupération des musiques
    tracks = await getPlaylistTrackInfo(id_playlist);
    tracks = tracks.filter(track => track != null);
    nbTracks = tracks.length;

    // création de la liste des matchs
    for (let i = 0; i < nbTracks; i++) {
      for (let j = i+1; j < nbTracks; j++) {
        //ajout des match dans un ordre aléatoire
        if (Math.random() > 0.5) {matchList.push([tracks[i].uri, tracks[j].uri]);}
        else {matchList.push([tracks[j].uri, tracks[i].uri]);}
      }
    }
    
    tracks.forEach(track => { score[track.uri] = 1000; });
    
    localStorage.setItem('tracks'+id_playlist, JSON.stringify(tracks));
    localStorage.setItem('nbTracks'+id_playlist, JSON.stringify(nbTracks));
    localStorage.setItem('matchList'+id_playlist, JSON.stringify(matchList));
    localStorage.setItem('score'+id_playlist, JSON.stringify(score));
  }

  let nbMatchTotal = nbTracks * (nbTracks - 1) / 2;
  let nbMatch = nbMatchTotal - matchList.length;
  const spanNbMatch = document.querySelector('.nb-matchs');
  spanNbMatch.textContent = parseFloat((nbMatch/nbMatchTotal*100).toFixed(1)) + '%';
  
  // sélectionne deux chansons aléatoires jusqu'à ce que tous les matchs aient été joués
  while (nbMatch < nbMatchTotal) {

    // sélectionne deux chansons aléatoires
    const [trackAUri, trackBUri] = matchList.splice(Math.floor(Math.random() * matchList.length), 1)[0];
    const trackA = tracks.find(track => track.uri === trackAUri);
    const trackB = tracks.find(track => track.uri === trackBUri);
    localStorage.setItem('matchList'+id_playlist, JSON.stringify(matchList));

    // met à jour la carte avec les infos des chansons sélectionnées
    updateCardWithTrackInfo(trackA, 1);
    updateCardWithTrackInfo(trackB, 2);

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

    
    localStorage.setItem("score"+id_playlist, JSON.stringify(score));
    
    // Mise à jour du nombres de matchs
    nbMatch = nbMatchTotal - matchList.length;
    spanNbMatch.textContent = (nbMatch/nbMatchTotal*100).toFixed(1) + '%';
    scoreButton.style.visibility = 'visible';

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // quand tous les match ont été faits : afficher les scores
  scoreButton.style.visibility = 'hidden';
  toggleScoreView();
}
