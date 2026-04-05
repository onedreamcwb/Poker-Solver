// Constantes do Poker
export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
// Representação simplificada de forças (apenas para o simulador saber o que priorizar)
// Em um sistema real, usaríamos a matriz 13x13 completa (ex: AKs, JTo, 88).
export const POSITIONAL_WEIGHTS = {
    'random': 1.0, // Aceita qualquer carta (100% range)
    'btn': 0.40,   // Filtra o baralho para as top 40% melhores cartas iniciais
    'co': 0.25,
    'mp': 0.15,
    'utg': 0.10    // Aceita apenas pares altos e broadways fortes
};

// Função auxiliar para estimar a força bruta de uma carta isolada no pré-flop
export function getCardPreflopWeight(card) {
    const rankValues = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'T':10,'J':11,'Q':12,'K':13,'A':14};
    return rankValues[card.rank];
}
/**
 * Gera um baralho padrão de 52 cartas.
 * @returns {Array} Array de objetos representando as cartas
 */
export function generateDeck() {
    const deck = [];
    for (let suit of SUITS) {
        for (let rank of RANKS) {
            deck.push({
                id: `${rank}${suit}`,
                rank: rank,
                suit: suit,
                color: (suit === '♥' || suit === '♦') ? 'red' : 'black'
            });
        }
    }
    return deck;
}
// Gera a matriz 13x13 estruturada
export function generateHandMatrix() {
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const matrix = [];

    for (let row = 0; row < 13; row++) {
        for (let col = 0; col < 13; col++) {
            let type, id;
            if (row === col) {
                type = 'pair';
                id = `${ranks[row]}${ranks[col]}`; // Ex: AA
            } else if (col > row) {
                type = 'suited';
                id = `${ranks[row]}${ranks[col]}s`; // Ex: AKs
            } else {
                type = 'offsuit';
                id = `${ranks[col]}${ranks[row]}o`; // Ex: AKo
            }
            matrix.push({ id, type, rank1: ranks[row], rank2: ranks[col] });
        }
    }
    return matrix;
}