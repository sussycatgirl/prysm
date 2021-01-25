/**
 * Transforms a time input like "1d 12h" into milliseconds.
 * @param {string} input 
 */
module.exports.getTimeInput = (input) => {
    let inputArr = input.split(' ');

    // No idea how this works. It just does.
    let total = 0;
    let flag = false;
    let last;
    while (!flag) {
        if (!inputArr[0]) {flag = true; break;}
        let localStr = inputArr[0].toLowerCase();

        let nums = localStr;
        Object.keys(msPerLetter).forEach(unit => nums = nums.replace(new RegExp(unit, 'g'), ''));
        if (isNaN(nums)) {flag = true; break}

        while (localStr != undefined && Object.keys(msPerLetter).indexOf(localStr.slice(-1)) >= -1 && localStr.slice(-1) != '') {

            let ms = msPerLetter[localStr.slice(-1)];
            localStr = localStr.slice(0, -1);

            let time = '';
            while (!isNaN(localStr.slice(-1)) && localStr.slice(-1)) {
                time = localStr.slice(-1) + time;
                localStr = localStr.slice(0, -1);
            }

            if (ms == undefined || isNaN(time)) flag = true; else {
                total += ms*time;
                if (!last) last = inputArr.shift(); else inputArr.shift();
            }
        }
    }
    return {
        delay: total, 
        text: inputArr.join(' ')
    };
}


const msPerLetter = {
    "s": 1000,
    "m": 1000 * 60,
    "h": 1000 * 60 * 60,
    "d": 1000 * 60 * 60 * 24,
    "y": 1000 * 60 * 60 * 24 * 365
}