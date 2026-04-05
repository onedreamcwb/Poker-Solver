// ==========================================
// js/engine.js
// Motor de Monte Carlo e Teoria dos Jogos
// ==========================================

import { generateDeck } from './utils.js';
import { RangeConverter } from './range.js';

export class MonteCarloEngine {
    constructor(uiController) {
        this.ui = uiController;
        this.iterations = 10000; // Padrão industrial para simulações rápidas no browser
        this.bindEvents();
    }

    bindEvents() {
        if (this.ui.btnCalculate) {
            this.ui.btnCalculate.addEventListener('click', () => this.startSimulation());
        }
    }

    startSimulation() {
        // Bloqueia a UI para evitar múltiplos cliques
        this.ui.btnCalculate.disabled = true;
        this.ui.btnCalculate.innerText = "A Simular...";
        document.getElementById('mc-progress').style.width = '0%';
        
        // Extrai o estado atual da mesa
        const heroCards = this.ui.state.hero;
        const villainCards = this.ui.state.villain;
        const boardCards = this.ui.state.board.filter(c => c !== null);

        // 1. Identifica os Blockers ("Dead Cards") - Cartas que o Hero ou a Mesa já têm
        const deadCards = [...heroCards, ...boardCards].map(c => c.id);

        // 2. Converte a Matriz 13x13 num Array de pares de cartas válidos para o Vilão
        const villainRangeCombos = RangeConverter.getCombinations(this.ui.rangeState, deadCards);

        // 3. Inicia o loop assíncrono
        this.runMonteCarlo(heroCards, villainCards, boardCards, villainRangeCombos);
    }

    runMonteCarlo(hero, villain, board, villainRangeCombos) {
        const fullDeck = generateDeck();
        // Remove do baralho as cartas que já sabemos exatamente onde estão (Hero + Board)
        const knownCardsIds = new Set([...hero, ...board].map(c => c.id));
        const baseRemainingDeck = fullDeck.filter(c => !knownCardsIds.has(c.id));
        const cardsNeededForBoard = 5 - board.length;

        let wins = 0;
        let ties = 0;
        const totalRuns = this.iterations;
        let currentRun = 0;
        
        // Chunking: Processamos blocos de 250 simulações por frame para não congelar o browser
        const chunkSize = 250; 

        const processChunk = () => {
            const end = Math.min(currentRun + chunkSize, totalRuns);
            
            for (let i = currentRun; i < end; i++) {
                // Cópia rápida do deck restante
                let deckCopy = [...baseRemainingDeck];
                
                // Shuffle Rápido (Fisher-Yates) no baralho
                for (let j = deckCopy.length - 1; j > 0; j--) {
                    const k = Math.floor(Math.random() * (j + 1));
                    [deckCopy[j], deckCopy[k]] = [deckCopy[k], deckCopy[j]];
                }

                let simulatedVillain = [...villain];
                let cardsNeededForVillain = 2 - simulatedVillain.filter(c => c !== null).length;

                // --- INJEÇÃO DE RANGE DO VILÃO ---
                // Se o utilizador não marcou as cartas do vilão manualmente (cardsNeededForVillain === 2)
                if (cardsNeededForVillain === 2) {
                    if (villainRangeCombos.length > 0) {
                        // O utilizador escolheu um Range na Matriz: sorteamos um combo válido!
                        const randomComboIndex = Math.floor(Math.random() * villainRangeCombos.length);
                        const chosenCombo = villainRangeCombos[randomComboIndex];
                        simulatedVillain = chosenCombo;

                        // Retira as cartas escolhidas do deck para não caírem acidentalmente no Board
                        deckCopy = deckCopy.filter(c => c.id !== chosenCombo[0].id && c.id !== chosenCombo[1].id);
                    } else {
                        // Sem Range na Matriz: o Vilão recebe duas cartas 100% aleatórias
                        simulatedVillain[0] = deckCopy.pop();
                        simulatedVillain[1] = deckCopy.pop();
                    }
                }

                // Distribui o resto do board
                const simulatedBoard = [...board, ...deckCopy.slice(0, cardsNeededForBoard)];

                // Avalia e pontua
                const heroScore = this.evaluateHand([...hero, ...simulatedBoard]);
                const villainScore = this.evaluateHand([...simulatedVillain, ...simulatedBoard]);

                if (heroScore > villainScore) wins++;
                else if (heroScore === villainScore) ties++;
            }

            currentRun = end;
            
            // Atualiza a Barra de Progresso na UI
            document.getElementById('mc-iterations').innerText = currentRun;
            document.getElementById('mc-progress').style.width = `${(currentRun / totalRuns) * 100}%`;

            if (currentRun < totalRuns) {
                // Chama o próximo chunk no próximo frame (mantém 60fps na UI)
                requestAnimationFrame(processChunk);
            } else {
                // Simulação terminou, calcula o EV
                this.calculateResults(wins, ties, totalRuns);
            }
        };

        // Arranca o primeiro chunk
        requestAnimationFrame(processChunk);
    }

    calculateResults(wins, ties, totalRuns) {
        // Cálculo da Equidade (Vitórias + Metade dos Empates)
        const equity = (wins + (ties / 2)) / totalRuns;
        const equityPercent = (equity * 100).toFixed(2);
        
        // Puxa valores de aposta inseridos na UI
        const potSize = parseFloat(document.getElementById('pot-size').value) || 0;
        const heroBet = parseFloat(document.getElementById('hero-bet').value) || 0;
        const villainBet = parseFloat(document.getElementById('villain-bet').value) || 0;

        // --- CÁLCULO DE EXPECTED VALUE (EV) ---
        // EV (Call) = (Equidade * Recompensa) - ((1 - Equidade) * Risco)
        const reward = potSize + villainBet;
        const risk = heroBet;
        const ev = (equity * reward) - ((1 - equity) * risk);

        // Atualiza a UI com os resultados
        document.getElementById('res-equity').innerText = `${equityPercent}%`;
        
        const evElement = document.getElementById('res-ev');
        evElement.innerText = `${ev > 0 ? '+' : ''}${ev.toFixed(2)} BB`;
        
        // Cores Dinâmicas: Verde para EV Positivo, Vermelho para EV Negativo
        evElement.style.color = ev > 0 ? 'var(--accent-color)' : 'var(--danger-color)';

        // Restaura o botão
        this.ui.btnCalculate.disabled = false;
        this.ui.btnCalculate.innerText = "Calcular EV";
    }

    // ==========================================
    // HEURÍSTICA DE AVALIAÇÃO DE MÃOS
    // ==========================================
    // Converte um array de 7 cartas numa pontuação matemática absoluta
    evaluateHand(cards) {
        const rankValues = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'T':10,'J':11,'Q':12,'K':13,'A':14};
        
        let suitsCount = {'♠':[], '♥':[], '♦':[], '♣':[]};
        let ranksCount = {};
        
        cards.forEach(c => {
            const val = rankValues[c.rank];
            suitsCount[c.suit].push(val);
            ranksCount[val] = (ranksCount[val] || 0) + 1;
        });

        // Verifica Flush
        let flushCards = Object.values(suitsCount).find(arr => arr.length >= 5);
        if (flushCards) flushCards.sort((a,b) => b - a);

        // Agrupa por quantidade para achar Pares, Trincas, Quadras
        const counts = Object.entries(ranksCount).map(([val, count]) => ({val: parseInt(val), count}));
        counts.sort((a, b) => b.count - a.count || b.val - a.val);

        const isQuads = counts[0].count === 4;
        const isFullHouse = counts[0].count === 3 && counts.length > 1 && counts[1].count >= 2;
        const isTrips = counts[0].count === 3;
        const isTwoPair = counts[0].count === 2 && counts.length > 1 && counts[1].count === 2;
        const isPair = counts[0].count === 2;

        // Verifica Straight (Sequência)
        const uniqueRanks = [...new Set(cards.map(c => rankValues[c.rank]))].sort((a,b) => b - a);
        // Regra do Ás como carta baixa (A-2-3-4-5)
        if (uniqueRanks.includes(14)) uniqueRanks.push(1); 
        
        let straightHigh = 0;
        let consecutive = 1;
        for (let i = 0; i < uniqueRanks.length - 1; i++) {
            if (uniqueRanks[i] - 1 === uniqueRanks[i+1]) {
                consecutive++;
                if (consecutive === 5) {
                    straightHigh = uniqueRanks[i-3];
                    break;
                }
            } else {
                consecutive = 1;
            }
        }

        // Verifica Straight Flush
        let straightFlushHigh = 0;
        if (flushCards && straightHigh) {
            let sfConsecutive = 1;
            for (let i = 0; i < flushCards.length - 1; i++) {
                if (flushCards[i] - 1 === flushCards[i+1]) {
                    sfConsecutive++;
                    if (sfConsecutive === 5) {
                        straightFlushHigh = flushCards[i-3];
                        break;
                    }
                } else {
                    sfConsecutive = 1;
                }
            }
        }

        // ATRIBUIÇÃO DE SCORE (Base + Kickers)
        // Usamos valores na casa dos milhões para garantir que um par nunca bate uma trinca, 
        // mas que um Par de Áses (A) bate um Par de Reis (K) através dos decimais/kickers.
        if (straightFlushHigh) return 8000000 + straightFlushHigh;
        if (isQuads) return 7000000 + (counts[0].val * 100) + (counts.find(c => c.val !== counts[0].val)?.val || 0);
        if (isFullHouse) return 6000000 + (counts[0].val * 100) + counts[1].val;
        if (flushCards) return 5000000 + (flushCards[0] * 10000) + (flushCards[1] * 1000) + (flushCards[2] * 100) + flushCards[3];
        if (straightHigh) return 4000000 + straightHigh;
        if (isTrips) return 3000000 + (counts[0].val * 10000) + (counts[1].val * 100) + counts[2].val;
        if (isTwoPair) return 2000000 + (counts[0].val * 10000) + (counts[1].val * 100) + counts[2].val;
        if (isPair) return 1000000 + (counts[0].val * 100000) + (counts[1].val * 10000) + (counts[2].val * 100) + counts[3].val;
        
        // Carta Alta (High Card)
        return counts[0].val * 100000 + counts[1].val * 10000 + counts[2].val * 1000 + counts[3].val * 100 + counts[4].val;
    }
}