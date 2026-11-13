export const donationKeys = {
    all: ['donations'],
    detail: (id) => ['donations', 'detail', id],
    streams: () => ['donations', 'stream'],
    stream: (streamId) => ['donations', 'stream', streamId],
    // The caller's earnings (/monetization/*)
    monetization: () => ['donations', 'monetization'],
    summary: () => ['donations', 'monetization', 'summary'],
    daily: (days) => ['donations', 'monetization', 'daily', days],
    received: (filters) => ['donations', 'monetization', 'received', filters],
    byStream: () => ['donations', 'monetization', 'streams'],
    topDonors: (filters) => ['donations', 'monetization', 'top-donors', filters],
}
