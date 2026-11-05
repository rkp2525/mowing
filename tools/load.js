// Loads the DOM-free game modules into Node's global scope.
const vm = require('vm'), fs = require('fs'), path = require('path');
for (const f of ['data.js', 'groundskeeping.js', 'sim.js', 'bot.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), { filename: f });
}
module.exports = globalThis.MOW;
