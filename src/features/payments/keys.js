export const paymentKeys = {
    all: ['payments'],
    cards: () => ['payments', 'cards'],
    bind: (bindId) => ['payments', 'bind', bindId],
}
