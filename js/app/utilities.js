/**
 * Function to convert Milliseconds to Time format (hh:mm:ss)
 * @param  {int}    duration The duration in milliseconds
 * @return {string} The new time format in (00:00)
 */
function msToTime(duration) {
    var seconds = parseInt((duration/1000)%60),
        minutes = parseInt((duration/(1000*60))%60);

    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return minutes + ":" + seconds;
}

/**
 * Function to reeturn a Hex value from an ID / Number
 * @param  {int}    id The value to convert
 * @return {string} The Hex value
 */
function getHex(id) {
    var hex = (parseInt(id, 10)).toString(16);
    if (hex.length < 2) {
        hex = '0' + hex;
    }
    return "0x" + hex;
}

/**
 * Fuction to download a file
 */
function downloadFile(uri) {
//
//var csv = “Abc, DEF, GHI, JKLM”
//
//// Data URI
//
//csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);
    $(this).attr({
        'href': uri,
        'target': '_blank'
    });
}