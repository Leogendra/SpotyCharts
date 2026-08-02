function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function shuffle_array(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


function format_number(nbToDisplay) {
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