function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function epochToDate(epochSeconds) {
    const date = new Date(epochSeconds * 1000);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return [day, month, year];
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function formatNumber(nbToDisplay) {
    let stringToDisplay;
    if (nbToDisplay >= 1000) {
        stringToDisplay = nbToDisplay.toString();
        stringToDisplay = stringToDisplay.split("").reverse().join("");
        stringToDisplay = stringToDisplay.replace(/(.{3})/g, "$1 ");
        stringToDisplay = stringToDisplay.split("").reverse().join("");
    }
    else {
        stringToDisplay = nbToDisplay.toString();
    }
    return stringToDisplay;
}