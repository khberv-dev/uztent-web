export const donationKeys = {
    all: ['donations'],
    detail: (id) => ['donations', 'detail', id],
    streams: () => ['donations', 'stream'],
    stream: (streamId) => ['donations', 'stream', streamId],
}
