// js/main.js
import { drawRandomHand, getHandNotation } from './utils.js';
import { evaluateAction } from './engine.js';

// ---- MAPEAMENTO DA UI ----
const navItems = document.querySelectorAll('.nav-item');
const moduleTitle = document.getElementById('module-title');
const moduleDesc = document.getElementById('module-description');

const boardArea = document.getElementById('board-area');
const configVillain = document.getElementById('config-villain');
const posSelect = document.getElementById('train-position');
const villainSelect = document.getElementById('villain-position');

const btnStart = document.getElementById('btn-start-training');
const btnStop = document.getElementById('btn-stop-training');
const actionControls = document.getElementById('action-controls');

const btnAction1 = document.getElementById('action-fold');
const btnAction2 = document.getElementById('action-call');
const btnAction3 = document.getElementById('action-raise');

const slot1 = document.getElementById('slot-1');
const slot2 = document.getElementById('slot-2');
const scenarioText = document.getElementById('scenario-text');
const scoreCorrectEl = document.getElementById('score-correct');
const scoreWrongEl = document.getElementById('score-wrong');
const feedbackDisplay = document.getElementById('feedback-display');
const feedbackText = document.getElementById('feedback-text');

// ---- ESTADO GLOBAL ----
let currentMode = 'rfi'; // Inicia no módulo RFI
let isTraining = false;
let currentHand = [];
let currentNotation = '';
let currentPosition = '';
let score = { correct: 0, wrong: 0 };

// ---- CONTROLADOR DE NAVEGAÇÃO (LMS) ----
function switchMode(mode, clickedElement) {
    if (isTraining) {
        alert("Por favor, pare a sessão atual antes de trocar de módulo.");
        return;
    }

    currentMode = mode;

    // Atualiza Visual do Menu
    navItems.forEach(item => item.classList.remove('active'));
    clickedElement.classList.add('active');
    moduleTitle.innerText = `Treinador: ${clickedElement.innerText}`;

    // Adapta a Interface Baseado no Módulo Escolhido
    if (mode === 'rfi') {
        moduleDesc.innerText = "A ação rodou em FOLD até você. Qual a decisão correta?";
        boardArea.classList.add('hidden');
        configVillain.classList.add('hidden');
        
        btnAction1.innerText = 'FOLD'; btnAction1.className = 'btn-action fold';
        btnAction2.innerText = 'CALL'; btnAction2.className = 'btn-action call';
        btnAction3.innerText = 'RAISE'; btnAction3.className = 'btn-action raise';
        btnAction3.style.display = 'block';

    } else if (mode === 'cbet-ip') {
        moduleDesc.innerText = "Você deu Raise pré-flop e o BB pagou. O Flop bateu. Ação?";
        boardArea.classList.remove('hidden'); // Revela as 3 cartas do Flop
        configVillain.classList.add('hidden');
        
        btnAction1.innerText = 'CHECK'; btnAction1.className = 'btn-action fold'; // Reutilizando cores
        btnAction2.innerText = 'BET'; btnAction2.className = 'btn-action raise';
        btnAction3.style.display = 'none'; // Esconde o terceiro botão

    } else if (mode.includes('bb-vs')) {
        moduleDesc.innerText = "Um oponente deu Raise. Você está no Big Blind. O que fazer?";
        boardArea.classList.add('hidden');
        configVillain.classList.remove('hidden'); // Pede para selecionar a posição do Vilão
        
        btnAction1.innerText = 'FOLD'; btnAction1.className = 'btn-action fold';
        btnAction2.innerText = 'CALL'; btnAction2.className = 'btn-action call';
        btnAction3.innerText = '3-BET'; btnAction3.className = 'btn-action raise';
        btnAction3.style.display = 'block';
    } else {
        moduleDesc.innerText = "Módulo em desenvolvimento... Prepare-se!";
        boardArea.classList.add('hidden');
        configVillain.classList.add('hidden');
    }
}

// Atribui os eventos de clique na barra lateral
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        switchMode(e.target.dataset.mode, e.target);
    });
});

// ---- FUNÇÕES VISUAIS (CARTAS) ----
function updateCardSlot(slot, card) {
    slot.classList.remove('empty', 'red', 'black');
    slot.classList.add('filled', card.color);
    slot.innerHTML = `${card.rank}<br>${card.suit}`;
}

function clearCardSlot(slot) {
    slot.classList.add('empty');
    slot.classList.remove('filled', 'red', 'black');
    slot.innerHTML = '';
}

function dealNewHand() {
    currentHand = drawRandomHand();
    currentNotation = getHandNotation(currentHand[0], currentHand[1]);
    
    updateCardSlot(slot1, currentHand[0]);
    updateCardSlot(slot2, currentHand[1]);
    
    if (currentMode === 'rfi') {
        scenarioText.innerText = `Posição: ${currentPosition.toUpperCase()}. Qual a sua ação?`;
    } else {
        scenarioText.innerText = `Cenário carregado. Ação?`;
    }
}

// ---- NÚCLEO DO JOGO ----
function handleAction(actionType) {
    if (!isTraining) return;
    
    // O motor vai avaliar baseado no MODO atual, na sua mão e na sua posição
    const result = evaluateAction(currentMode, currentPosition, currentNotation, actionType);
    
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
    
    feedbackText.innerText = result.msg;
    dealNewHand();
}

// ---- EVENTOS DOS BOTÕES ----
btnStart.addEventListener('click', () => {
    if(currentMode !== 'rfi') {
        alert("Chefe, por enquanto apenas a lógica RFI está programada no Motor. Use o menu lateral para voltar ao RFI.");
        return;
    }

    isTraining = true;
    score = { correct: 0, wrong: 0 };
    scoreCorrectEl.innerText = '0';
    scoreWrongEl.innerText = '0';
    
    currentPosition = posSelect.value;
    posSelect.disabled = true;
    
    btnStart.style.display = 'none';
    btnStop.style.display = 'block';
    actionControls.style.display = 'flex';
    
    feedbackDisplay.classList.remove('success', 'error');
    feedbackText.innerText = `Treino focado em ${currentPosition.toUpperCase()} iniciado!`;
    
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
    feedbackText.innerText = `Sessão encerrada.`;
});

// Ações dinâmicas (no modo RFI action1 é Fold. No C-Bet, action1 é Check).
btnAction1.addEventListener('click', () => handleAction(btnAction1.innerText.toLowerCase()));
btnAction2.addEventListener('click', () => handleAction(btnAction2.innerText.toLowerCase()));
btnAction3.addEventListener('click', () => handleAction(btnAction3.innerText.toLowerCase()));