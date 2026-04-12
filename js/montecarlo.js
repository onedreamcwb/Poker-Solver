// js/montecarlo.js
import { getDeck, suits } from './utils.js';

export class MonteCarlo {
    // Converte o Set de mãos (Ex: 'AKs', '88') em combinações reais descartando Blockers
    static getCombinations(rangeSet, deadCardsIds) {
        if (!rangeSet || rangeSet.size === 0) return [];
        const combinations = [];
        const dead = new Set(deadCardsIds);

        rangeSet.forEach(handId => {
            if (handId.length === 2) {
                const rank = handId[0];
                for (let i = 0; i < suits.length; i++) {
                    for (let j = i + 1; j < suits.length; j++) {
                        const c1 = { id: `${rank}${suits[i]}`, rank: rank, suit: suits[i], color: (suits[i] === '♥' || suits[i] === '♦') ? 'red' : 'black' };
                        const c2 = { id: `${rank}${suits[j]}`, rank: rank, suit: suits[j], color: (suits[j] === '♥' || suits[j] === '♦') ? 'red' : 'black' };
                        if (!dead.has(c1.id) && !dead.has(c2.id)) combinations.push([c1, c2]);
                    }
                }
            } else if (handId.endsWith('s')) {
                const r1 = handId[0], r2 = handId[1];
                for (let s of suits) {
                    const c1 = { id: `${r1}${s}`, rank: r1, suit: s, color: (s === '♥' || s === '♦') ? 'red' : 'black' };
                    const c2 = { id: `${r2}${s}`, rank: r2, suit: s, color: (s === '♥' || s === '♦') ? 'red' : 'black' };
                    if (!dead.has(c1.id) && !dead.has(c2.id)) combinations.push([c1, c2]);
                }
            } else if (handId.endsWith('o')) {
                const r1 = handId[0], r2 = handId[1];
                for (let s1 of suits) {
                    for (let s2 of suits) {
                        if (s1 !== s2) {
                            const c1 = { id: `${r1}${s1}`, rank: r1, suit: s1, color: (s1 === '♥' || s1 === '♦') ? 'red' : 'black' };
                            const c2 = { id: `${r2}${s2}`, rank: r2, suit: s2, color: (s2 === '♥' || s2 === '♦') ? 'red' : 'black' };
                            if (!dead.has(c1.id) && !dead.has(c2.id)) combinations.push([c1, c2]);
                        }
                    }
                }
            }
        });
        return combinations;
    }

    // Heurística de Avaliação Absoluta de Força
    static evaluateHand(cards) {
        const rankValues = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'T':10,'J':11,'Q':12,'K':13,'A':14};
        let suitsCount = {'♠':[], '♥':[], '♦':[], '♣':[]};
        let ranksCount = {};
        
        cards.forEach(c => {
            const val = rankValues[c.rank];
            suitsCount[c.suit].push(val);
            ranksCount[val] = (ranksCount[val] || 0) + 1;
        });

        let flushCards = Object.values(suitsCount).find(arr => arr.length >= 5);
        if (flushCards) flushCards.sort((a,b) => b - a);

        const counts = Object.entries(ranksCount).map(([val, count]) => ({val: parseInt(val), count}));
        counts.sort((a, b) => b.count - a.count || b.val - a.val);

        const isQuads = counts[0].count === 4;
        const isFullHouse = counts[0].count === 3 && counts.length > 1 && counts[1].count >= 2;
        const isTrips = counts[0].count === 3;
        const isTwoPair = counts[0].count === 2 && counts.length > 1 && counts[1].count === 2;
        const isPair = counts[0].count === 2;

        const uniqueRanks = [...new Set(cards.map(c => rankValues[c.rank]))].sort((a,b) => b - a);
        if (uniqueRanks.includes(14)) uniqueRanks.push(1); 
        
        let straightHigh = 0, consecutive = 1;
        for (let i = 0; i < uniqueRanks.length - 1; i++) {
            if (uniqueRanks[i] - 1 === uniqueRanks[i+1]) {
                consecutive++;
                if (consecutive === 5) { straightHigh = uniqueRanks[i-3]; break; }
            } else { consecutive = 1; }
        }

        let straightFlushHigh = 0;
        if (flushCards && straightHigh) {
            let sfConsecutive = 1;
            for (let i = 0; i < flushCards.length - 1; i++) {
                if (flushCards[i] - 1 === flushCards[i+1]) {
                    sfConsecutive++;
                    if (sfConsecutive === 5) { straightFlushHigh = flushCards[i-3]; break; }
                } else { sfConsecutive = 1; }
            }
        }

        if (straightFlushHigh) return 8000000 + straightFlushHigh;
        if (isQuads) return 7000000 + (counts[0].val * 100) + (counts.find(c => c.val !== counts[0].val)?.val || 0);
        if (isFullHouse) return 6000000 + (counts[0].val * 100) + counts[1].val;
        if (flushCards) return 5000000 + (flushCards[0] * 10000) + (flushCards[1] * 1000) + (flushCards[2] * 100) + flushCards[3];
        if (straightHigh) return 4000000 + straightHigh;
        if (isTrips) return 3000000 + (counts[0].val * 10000) + (counts[1].val * 100) + counts[2].val;
        if (isTwoPair) return 2000000 + (counts[0].val * 10000) + (counts[1].val * 100) + counts[2].val;
        if (isPair) return 1000000 + (counts[0].val * 100000) + (counts[1].val * 10000) + (counts[2].val * 100) + counts[3].val;
        
        return counts[0].val * 100000 + counts[1].val * 10000 + counts[2].val * 1000 + counts[3].val * 100 + counts[4].val;
    }

    // O Motor Principal de Simulação
    static run(heroCards, boardCards, villainRangeSet, iterations, updateCallback, finishCallback) {
        // Formata os IDs
        const hero = heroCards.map(c => ({...c, id: `${c.rank}${c.suit}`}));
        const board = boardCards.map(c => ({...c, id: `${c.rank}${c.suit}`}));
        
        const deadCards = [...hero, ...board].map(c => c.id);
        const fullDeck = getDeck().map(c => ({...c, id: `${c.rank}${c.suit}`}));
        const baseRemainingDeck = fullDeck.filter(c => !deadCards.includes(c.id));
        
        const villainRangeCombos = this.getCombinations(villainRangeSet, deadCards);
        const cardsNeededForBoard = 5 - board.length;

        let wins = 0, ties = 0, currentRun = 0;
        const chunkSize = 250; // Para não travar a UI

        const processChunk = () => {
            const end = Math.min(currentRun + chunkSize, iterations);
            
            for (let i = currentRun; i < end; i++) {
                let deckCopy = [...baseRemainingDeck];
                
                // Shuffle Rápido
                for (let j = deckCopy.length - 1; j > 0; j--) {
                    const k = Math.floor(Math.random() * (j + 1));
                    [deckCopy[j], deckCopy[k]] = [deckCopy[k], deckCopy[j]];
                }

                let simulatedVillain = [];
                // Se o vilão tem um Range configurado, puxamos uma mão aleatória desse Range
                if (villainRangeCombos.length > 0) {
                    const randomCombo = villainRangeCombos[Math.floor(Math.random() * villainRangeCombos.length)];
                    simulatedVillain = randomCombo;
                    deckCopy = deckCopy.filter(c => c.id !== randomCombo[0].id && c.id !== randomCombo[1].id);
                } else {
                    // Sem Range = Qualquer duas cartas (Random)
                    simulatedVillain = [deckCopy.pop(), deckCopy.pop()];
                }

                const simulatedBoard = [...board, ...deckCopy.slice(0, cardsNeededForBoard)];
                const heroScore = this.evaluateHand([...hero, ...simulatedBoard]);
                const villainScore = this.evaluateHand([...simulatedVillain, ...simulatedBoard]);

                if (heroScore > villainScore) wins++;
                else if (heroScore === villainScore) ties++;
            }

            currentRun = end;
            updateCallback(currentRun, iterations);

            if (currentRun < iterations) {
                requestAnimationFrame(processChunk);
            } else {
                const equity = (wins + (ties / 2)) / iterations;
                finishCallback(equity);
            }
        };

        requestAnimationFrame(processChunk);
    }
}