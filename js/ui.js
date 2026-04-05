import { generateDeck, generateHandMatrix } from './utils.js';

export class UIController {
    constructor() {
        this.deck = generateDeck();
        this.activeSlot = null; 
        
        // Estado atual das cartas alocadas na mesa
        this.state = {
            hero: [null, null],
            villain: [null, null],
            board: [null, null, null, null, null]
        };

        // Guarda as mãos selecionadas na Matriz 13x13 (ex: 'AA', 'AKs', 'JTo')
        this.rangeState = new Set();

        this.initElements();
        this.renderDeck();
        this.renderMatrix();
        this.bindEvents();
        this.checkEngineReady();
    }

    initElements() {
        // Elementos do Baralho e Mesa
        this.deckContainer = document.getElementById('deck-container');
        this.cardSlots = document.querySelectorAll('.card-slot');
        this.btnCalculate = document.getElementById('btn-calculate');

        // Elementos de Posição
        this.heroPositionSelect = document.getElementById('hero-position');
        this.villainPositionSelect = document.getElementById('villain-position');

        // Elementos da Matriz de Range 13x13
        this.btnOpenMatrix = document.getElementById('btn-open-matrix');
        this.btnCloseMatrix = document.getElementById('btn-close-matrix');
        this.matrixContainer = document.getElementById('matrix-container');
        this.handMatrixEl = document.getElementById('hand-matrix');
        this.btnClearMatrix = document.getElementById('btn-clear-matrix');
        this.btnApplyPosition = document.getElementById('btn-apply-position');
    }

    // ==========================================
    // RENDERIZAÇÃO
    // ==========================================

    renderDeck() {
        this.deckContainer.innerHTML = '';
        this.deckContainer.classList.remove('hidden');

        this.deck.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = `deck-card ${card.color}`;
            cardEl.dataset.id = card.id;
            cardEl.innerHTML = `${card.rank}<br>${card.suit}`;
            
            cardEl.addEventListener('click', () => this.handleDeckCardClick(card, cardEl));
            
            this.deckContainer.appendChild(cardEl);
        });
    }

    renderMatrix() {
        const matrixData = generateHandMatrix();
        this.handMatrixEl.innerHTML = '';

        matrixData.forEach(hand => {
            const cell = document.createElement('div');
            cell.className = `matrix-cell ${hand.type}`;
            cell.dataset.id = hand.id;
            cell.innerText = hand.id;

            // Lógica de clique para selecionar/deselecionar a mão do range
            cell.addEventListener('click', () => {
                cell.classList.toggle('selected');
                if (cell.classList.contains('selected')) {
                    this.rangeState.add(hand.id);
                } else {
                    this.rangeState.delete(hand.id);
                }
            });

            this.handMatrixEl.appendChild(cell);
        });
    }

    // ==========================================
    // EVENTOS (BINDINGS)
    // ==========================================

    bindEvents() {
        // Cliques nos Slots de Cartas (Hero, Villain, Board)
        this.cardSlots.forEach(slot => {
            slot.addEventListener('click', () => this.handleSlotClick(slot));
        });

        // Controlos da Matriz
        if (this.btnOpenMatrix) {
            this.btnOpenMatrix.addEventListener('click', () => this.toggleMatrix());
        }
        if (this.btnCloseMatrix) {
            this.btnCloseMatrix.addEventListener('click', () => this.toggleMatrix());
        }
        if (this.btnClearMatrix) {
            this.btnClearMatrix.addEventListener('click', () => this.clearMatrix());
        }
        if (this.btnApplyPosition) {
            this.btnApplyPosition.addEventListener('click', () => this.applyPositionToMatrix());
        }
    }

    // ==========================================
    // LÓGICA DE CARTAS E MESA
    // ==========================================

    handleSlotClick(slot) {
        // Limpa o destaque visual de qualquer outro slot
        this.cardSlots.forEach(s => s.classList.remove('active-slot'));
        
        // Se o slot já estiver preenchido, removemos a carta e devolvemos ao baralho
        if (!slot.classList.contains('empty')) {
            this.removeCardFromSlot(slot);
            return;
        }

        // Marca o slot clicado como ativo (à espera que o utilizador escolha no baralho)
        this.activeSlot = slot;
        slot.classList.add('active-slot');
    }

    handleDeckCardClick(card, cardEl) {
        if (!this.activeSlot) return; // Se nenhum slot estiver selecionado, ignora
        if (cardEl.classList.contains('disabled')) return; // Carta já na mesa, ignora

        const owner = this.activeSlot.dataset.owner;
        const index = this.activeSlot.dataset.index;
        
        // Atualiza o estado lógico
        this.state[owner][index] = card;

        // Atualiza o DOM (visual) do slot
        this.activeSlot.classList.remove('empty');
        this.activeSlot.classList.add('filled', card.color);
        this.activeSlot.innerHTML = `${card.rank}<br>${card.suit}`;
        this.activeSlot.dataset.cardId = card.id;

        // "Apaga" a carta visualmente no baralho principal
        cardEl.classList.add('disabled');

        // Limpa o estado do slot ativo
        this.activeSlot.classList.remove('active-slot');
        this.activeSlot = null;
        
        this.checkEngineReady();
    }

    removeCardFromSlot(slot) {
        const cardId = slot.dataset.cardId;
        if (!cardId) return;

        // Reativa a carta no baralho principal
        const deckCardEl = this.deckContainer.querySelector(`.deck-card[data-id="${cardId}"]`);
        if (deckCardEl) deckCardEl.classList.remove('disabled');

        // Limpa o estado lógico
        const owner = slot.dataset.owner;
        const index = slot.dataset.index;
        this.state[owner][index] = null;

        // Limpa o DOM (visual) do slot
        slot.classList.add('empty');
        slot.classList.remove('filled', 'red', 'black');
        slot.innerHTML = '';
        delete slot.dataset.cardId;
        
        this.checkEngineReady();
    }

    // ==========================================
    // LÓGICA DA MATRIZ DE RANGE
    // ==========================================

    toggleMatrix() {
        if (this.matrixContainer) {
            this.matrixContainer.classList.toggle('hidden');
        }
    }

    clearMatrix() {
        this.rangeState.clear();
        const cells = this.handMatrixEl.querySelectorAll('.matrix-cell');
        cells.forEach(cell => cell.classList.remove('selected'));
    }

    applyPositionToMatrix() {
        // Limpa a matriz antes de aplicar o novo range
        this.clearMatrix();
        const pos = this.villainPositionSelect.value;
        const cells = this.handMatrixEl.querySelectorAll('.matrix-cell');
        
        // Mapeamento heurístico rápido para teste do Solver
        cells.forEach(cell => {
            const handId = cell.dataset.id;
            let shouldSelect = false;

            if (pos === 'utg') {
                // UTG: Apenas mãos premium (Tight)
                const premium = ['AA','KK','QQ','JJ','TT','99','88','AKs','AQs','AJs','ATs','KQs','AKo','AQo'];
                if (premium.includes(handId)) shouldSelect = true;
            } 
            else if (pos === 'btn') {
                // Button: Range muito abrangente (Loose)
                const isPair = handId.length === 2; // ex: '88', '22'
                const isBroadway = ['A','K','Q','J','T'].includes(handId[0]) && ['A','K','Q','J','T'].includes(handId[1]);
                const isSuited = handId.includes('s');
                if (isPair || isBroadway || isSuited) shouldSelect = true;
            }
            else {
                // Outras Posições: Range médio (Blinds, MP, CO)
                if (handId.includes('A') || handId.includes('K') || handId.length === 2) {
                    shouldSelect = true;
                }
            }

            // Se a mão passar no filtro, seleciona a célula visualmente e guarda no Set
            if (shouldSelect) {
                cell.classList.add('selected');
                this.rangeState.add(handId);
            }
        });
    }

    // ==========================================
    // VALIDAÇÕES
    // ==========================================

    checkEngineReady() {
        // Para calcular o EV, precisamos OBRIGATORIAMENTE que o Hero tenha as 2 cartas selecionadas.
        // O Vilão não precisa ter cartas na mesa, pois o motor assumirá o Range da Matriz ou a Posição.
        const heroReady = this.state.hero.every(c => c !== null);
        
        if (this.btnCalculate) {
            this.btnCalculate.disabled = !heroReady;
        }
    }
}