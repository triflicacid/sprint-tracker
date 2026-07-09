// a promise plus its resolve function, exposed separately - lets a test
// control exactly when an awaited async prop (e.g. onExport) settles, so it
// can assert on the pending state (e.g. a loading spinner) in between.
export function deferred<T = void>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve };
}
