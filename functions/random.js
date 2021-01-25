const Discord = require('discord.js');

/*
let random = require('../../functions/random.js').execute;
*/

module.exports = {
    execute(low, high) {
        low = Math.ceil(low);
        high = Math.floor(high);
        high = high + 1;
        rndm = Math.random();
        return Math.floor(rndm * (high - low) + low);
    }
}