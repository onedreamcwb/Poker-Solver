import { SUITS } from './utils.js';

export class RangeConverter {
    /**
     * Converte um Set de strings de mãos (ex: 'AA', 'AKs') em combinações reais de cartas.
     * @param {Set} rangeSet - Set contendo os IDs das mãos selecionadas na UI.
     * @param {Array} deadCardIds - Array de IDs de cartas que já estão em uso (Hero + Board).
     * @returns {Array} Array de pares de cartas válidos.
     */
    static getCombinations(rangeSet, deadCardIds) {
        const combinations = [];
        const dead = new Set(deadCardIds);

        rangeSet.forEach(handId => {
            if (handId.length === 2) {
                // PARES (ex: 'AA', '88') - 6 combinações possíveis
                const rank = handId[0];
                for (let i = 0; i < SUITS.length; i++) {
                    for (let j = i + 1; j < SUITS.length; j++) {
                        const c1 = `${rank}${SUITS[i]}`;
                        const c2 = `${rank}${SUITS[j]}`;
                        // Só adiciona se nenhuma das cartas for um Blocker ("Dead Card")
                        if (!dead.has(c1) && !dead.has(c2)) {
                            combinations.push([
                                { id: c1, rank: rank, suit: SUITS[i] },
                                { id: c2, rank: rank, suit: SUITS[j] }
                            ]);
                        }
                    }
                }
            } else if (handId.endsWith('s')) {
                // SUITED (ex: 'AKs', 'T9s') - 4 combinações possíveis
                const r1 = handId[0];
                const r2 = handId[1];
                for (let suit of SUITS) {
                    const c1 = `${r1}${suit}`;
                    const c2 = `${r2}${suit}`;
                    if (!dead.has(c1) && !dead.has(c2)) {
                        combinations.push([
                            { id: c1, rank: r1, suit: suit },
                            { id: c2, rank: r2, suit: suit }
                        ]);
                    }
                }
            } else if (handId.endsWith('o')) {
                // OFFSUIT (ex: 'AKo', 'JTo') - 12 combinações possíveis
                const r1 = handId[0];
                const r2 = handId[1];
                for (let s1 of SUITS) {
                    for (let s2 of SUITS) {
                        if (s1 !== s2) {
                            const c1 = `${r1}${s1}`;
                            const c2 = `${r2}${s2}`;
                            if (!dead.has(c1) && !dead.has(c2)) {
                                combinations.push([
                                    { id: c1, rank: r1, suit: s1 },
                                    { id: c2, rank: r2, suit: s2 }
                                ]);
                            }
                        }
                    }
                }
            }
        });

        return combinations;
    }
}