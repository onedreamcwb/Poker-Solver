// js/utils.js
export const suits = ['♠', '♥', '♦', '♣'];
export const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

// Gera um baralho padrão de 52 cartas
export function getDeck() {
    let deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ 
                rank, 
                suit,
                color: (suit === '♥' || suit === '♦') ? 'red' : 'black'
            });
        }
    }
    return deck;
}

// Sorteia 2 cartas aleatórias
export function drawRandomHand() {
    const deck = getDeck();
    // Algoritmo de Fisher-Yates para embaralhar
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return [deck[0], deck[1]];
}

// Converte as cartas em notação de poker (Ex: AKs, 72o, 88)
export function getHandNotation(card1, card2) {
    const rankValues = { '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'T':10, 'J':11, 'Q':12, 'K':13, 'A':14 };
    
    let high = card1, low = card2;
    if (rankValues[card2.rank] > rankValues[card1.rank]) {
        high = card2;
        low = card1;
    }

    if (high.rank === low.rank) return `${high.rank}${low.rank}`;
    const suited = high.suit === low.suit ? 's' : 'o';
    return `${high.rank}${low.rank}${suited}`;
}