let maxInstructions = 10000,
    arraySize = 30000;

/**
 * 
 * @param {String} input
 * @returns {{map: Array, out: Array, outStr: String, stats: {executions: number}}}
 */
module.exports.run = (input) => {
    const actions = input
        .split('')
        .filter(key => key.match(/\>|\<|\+|\-|\.|\,|\[|\]/));
    
    let arr = Array(arraySize).fill(0);
    let ptr = 0;
    let out = [];
    let instCount = 0;
    let currentInstruction = 0;
    
    /**
     * 
     * @param {Array} instructions 
     */
    function runInstructions(instructions) {
        let localInstCount = 0,
            loopDepth = 0;
        for (const action of instructions) {
            if (instCount > maxInstructions) throw `Exceeded limit of ${maxInstructions} instructions`;
            //console.debug(`Action ${instCount} (${localInstCount}): ${action} : ${actions[currentInstruction]} (${currentInstruction})`);
            instCount++, localInstCount++, currentInstruction++;
            
            if (loopDepth == 0) {
                switch(action) {
                    case '+':
                        // Increase value at pointer by 1
                        arr[ptr]++;
                    break;
                    case '-':
                        // Decrease value at pointer by 1
                        arr[ptr]--;
                    break;
                    case '>':
                        // Move pointer to the right
                        ptr++;
                    break;
                    case '<':
                        // Move pointer to the left
                        ptr--;
                    break;
                    case '.':
                        // Push value at pointer to output
                        out.push(arr[ptr]);
                    break;
                    case ',': break; // Ignore because im lazy
                    case '[':
                        // Loop actions in [] until value at pointer is 0
                        let loopContent = instructions.slice(localInstCount);
                        let closingIndex = 0;
                        
                        loopDepth++;
                        
                        // Find the matching closing bracket
                        let open = 1;
                        loopContent.forEach(a => {
                            if (open && a == '[') open++;
                            if (open && a == ']') open--;
                            if (open != 0) closingIndex++;
                        });
                        
                        if (open != 0) throw 'Could not find closing bracket';
                        loopContent = loopContent.slice(0, closingIndex);
                        
                        let startIndex = currentInstruction;
                        
                        while (arr[ptr] > 0 && loopContent.length > 0) {
                            runInstructions(loopContent);
                            currentInstruction = startIndex;
                        }
                    break;
                    case ']':
                        loopDepth--;
                    break;
                }
            } else if (action == ']') loopDepth--;
            
            if (arr[ptr] > 255) arr[ptr] -= 256;
            if (arr[ptr] < 0)   arr[ptr] += 256;
            if (ptr < 0 || ptr >= arraySize) throw 'Pointer out of bounds';
        }
        if (loopDepth < 0) throw 'Missing opening bracket';
    }
    
    try {
        runInstructions(actions);
    } catch(e) {
        let preview = '';
        for (let i = currentInstruction - 10; i < currentInstruction + 10; i++) {
            preview += actions[i] || ' ';
        }
        if (actions[currentInstruction + 11]) preview += ' ...';
        if (actions[currentInstruction - 11]) {
            preview = `... ${preview}\n    `
        } else preview += '\n'
        preview += '         ^';
        
        e = `Error at position ${currentInstruction}: ${e}\n\n${preview}`;
        throw e;
    }
    
    let outStr = '';
    out.forEach(o => outStr += String.fromCharCode(o));
    return { map: arr, out, outStr, stats: { executions: instCount } };
}