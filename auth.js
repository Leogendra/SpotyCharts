// authenticate with the Spotify API
async function getAuthSpotify() {

    const authResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa('84dba99e6bd94e13bfe796956773a7fc' + ':' + 'de3a97d84e05404fb3406469ae9d05e8')
        },
        body: 'grant_type=client_credentials'
    });
    const authData = await authResponse.json();
    return authData.access_token;
}

// authenticate with the Youtube API
async function getAuthYoutube() {
    return 'AIzaSyBHTTI42ZQYgPBYQxoM7qxt0LWfTR6hLWw';
}