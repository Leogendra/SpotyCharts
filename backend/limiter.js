function create_limiter(concurrency) {
    let active = 0;
    const queue = [];
    const drain = () => {
        while (active < concurrency && queue.length > 0) {
            const { fn, resolve, reject } = queue.shift();
            active++;
            Promise.resolve()
                .then(fn)
                .then(resolve, reject)
                .finally(() => {
                    active--;
                    drain();
                });
        }
    };
    return (fn) =>
        new Promise((resolve, reject) => {
            queue.push({ fn, resolve, reject });
            drain();
        });
}


module.exports = { create_limiter };
