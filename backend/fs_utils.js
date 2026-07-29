const fsp = require("fs/promises");


async function write_json_atomic(target, data) {
    const tmp = `${target}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(data, null, 2));
    await fsp.rename(tmp, target);
}


module.exports = { write_json_atomic };