export const followKeys = {
    all: ['follows'],
    status: (userId) => ['follows', 'status', userId],
    lists: () => ['follows', 'list'],
    followers: (userId) => ['follows', 'list', 'followers', userId],
    following: (userId) => ['follows', 'list', 'following', userId],
}
