// js/main.js
import { drawRandomHand, getHandNotation } from './utils.js';
import { evaluateAction } from './engine.js';

// Mapeamento de Elementos da UI
const btnStart = document.getElementById('btn-start-training');
const btnStop = document.getElementById('btn-stop-training');
const posSelect = document.getElementById('train-position');
const actionControls = document.getElementById('action-controls');
const scenarioText = document.getElementById('scenario-text');
const slot1 = document.getElementById('slot-1');
const slot2 = document.getElementById('slot-2');
const scoreCorrectEl = document.getElementById('score-correct');
const scoreWrongEl = document.getElementById('score-wrong');
const feedbackDisplay = document.getElementById('feedback-display');
const feedbackText = document.getElementById('feedback-text');

const btnFold = document.getElementById('action-fold');
const btnCall = document.getElementById('action-call');
const btnRaise = document.getElementById('action-raise');

// Estado do Sistema
let isTraining = false;
let currentHand = [];
let currentNotation = '';
let currentPosition = '';
let score = { correct: 0, wrong: 0 };

// Renderiza a carta visualmente na UI
function updateCardSlot(slot, card) {
    slot.classList.remove('empty', 'red', 'black');
    slot.classList.add('filled', card.color);
    slot.innerHTML = `${card.rank}<br>${card.suit}`;
}

// Limpa o slot da carta
function clearCardSlot(slot) {
    slot.classList.add('empty');
    slot.classList.remove('filled', 'red', 'black');
    slot.innerHTML = '';
}

// Distribui a mão e avança a interface
function dealNewHand() {
    currentHand = drawRandomHand();
    currentNotation = getHandNotation(currentHand[0], currentHand[1]);
    
    updateCardSlot(slot1, currentHand[0]);
    updateCardSlot(slot2, currentHand[1]);
    
    scenarioText.innerText = `Você está no ${currentPosition.toUpperCase()}. Todos rodaram em FOLD. Ação?`;
}

// Processa a jogada do utilizador
function handleAction(action) {
    if (!isTraining) return;
    
    const result = evaluateAction(currentPosition, currentNotation, action);
    
    // Atualiza classes CSS para cores do feedback
    feedbackDisplay.classList.remove('success', 'error');
    
    if (result.correct) {
        score.correct++;
        scoreCorrectEl.innerText = score.correct;
        feedbackDisplay.classList.add('success');
    } else {
        score.wrong++;
        scoreWrongEl.innerText = score.wrong;
        feedbackDisplay.classList.add('error');
    }
    
    // Exibe a mensagem do motor
    feedbackText.innerText = result.msg;
    
    // Entrega logo a próxima mão sem pausas (Foco no treino rápido)
    dealNewHand();
}

// Listeners dos Botões de Controle
btnStart.addEventListener('click', () => {
    isTraining = true;
    score = { correct: 0, wrong: 0 };
    scoreCorrectEl.innerText = '0';
    scoreWrongEl.innerText = '0';
    
    currentPosition = posSelect.value;
    posSelect.disabled = true; // Bloqueia a troca de posição durante a sessão
    
    btnStart.style.display = 'none';
    btnStop.style.display = 'block';
    actionControls.style.display = 'flex';
    
    feedbackDisplay.classList.remove('success', 'error');
    feedbackText.innerText = `Sessão iniciada em ${currentPosition.toUpperCase()}. Boa sorte!`;
    
    dealNewHand();
});

btnStop.addEventListener('click', () => {
    isTraining = false;
    posSelect.disabled = false;
    
    btnStart.style.display = 'block';
    btnStop.style.display = 'none';
    actionControls.style.display = 'none';
    
    scenarioText.innerText = 'Aguardando início...';
    clearCardSlot(slot1);
    clearCardSlot(slot2);
    
    feedbackDisplay.classList.remove('success', 'error');
    feedbackText.innerText = `Sessão finalizada. Placar final -> Acertos: ${score.correct} | Erros: ${score.wrong}`;
});

// Listeners dos Botões de Poker
btnFold.addEventListener('click', () => handleAction('fold'));
btnCall.addEventListener('click', () => handleAction('call'));
btnRaise.addEventListener('click', () => handleAction('raise'));