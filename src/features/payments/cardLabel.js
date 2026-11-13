const SYSTEMS = { uzcard: 'Uzcard', humo: 'Humo', visa: 'Visa', mastercard: 'Mastercard', unionpay: 'UnionPay' }

/** "Humo •••• 1519" */
export function cardLabel(card) {
    return `${SYSTEMS[card.ps] ?? card.ps ?? 'Karta'} •••• ${card.cardPan.slice(-4)}`
}
