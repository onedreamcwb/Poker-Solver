// js/main.js
import { getShuffledDeck, getHandNotation } from './utils.js';
import { evaluateAction } from './engine.js';

// ---- MAPEAMENTO DA UI ----
const navItems = document.querySelectorAll('.nav-item');
const moduleTitle = document.getElementById('module-title');
const moduleDesc = document.getElementById('module-description');

const boardArea = document.getElementById('board-area');
const configHero = document.getElementById('config-positions');
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
const flop1 = document.getElementById('flop-1');
const flop2 = document.getElementById('flop-2');
const flop3 = document.getElementById('flop-3');

const scenarioText = document.getElementById('scenario-text');
const scoreCorrectEl = document.getElementById('score-correct');
const scoreWrongEl = document.getElementById('score-wrong');
const feedbackDisplay = document.getElementById('feedback-display');
const feedbackText = document.getElementById('feedback-text');

// ---- ESTADO GLOBAL ----
let currentMode = 'rfi'; 
let isTraining = false;
let currentHand = [];
let currentBoard = [];
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
    navItems.forEach(item => item.classList.remove('active'));
    clickedElement.classList.add('active');
    moduleTitle.innerText = `Treinador: ${clickedElement.innerText}`;

    // BLOCO 1: RFI
    if (mode === 'rfi') {
        moduleDesc.innerText = "A ação rodou em FOLD até você. Qual a decisão correta?";
        boardArea.classList.add('hidden');
        configVillain.classList.add('hidden');
        configHero.classList.remove('hidden'); 
        
        btnAction1.innerText = 'FOLD'; btnAction1.className = 'btn-action fold';
        btnAction2.innerText = 'CALL'; btnAction2.className = 'btn-action call';
        btnAction3.innerText = 'RAISE'; btnAction3.className = 'btn-action raise';
        btnAction3.style.display = 'block';

    // BLOCO 1: C-BET PÓS-FLOP
    } else if (mode === 'cbet-ip') {
        moduleDesc.innerText = "Você deu Raise pré-flop e o BB pagou. O Flop bateu. Ação?";
        boardArea.classList.remove('hidden'); // REVELA AS 3 CARTAS DO FLOP
        configVillain.classList.add('hidden');
        configHero.classList.add('hidden'); 
        
        btnAction1.innerText = 'CHECK'; btnAction1.className = 'btn-action fold';
        btnAction2.innerText = 'BET'; btnAction2.className = 'btn-action raise';
        btnAction3.style.display = 'none'; // Esconde o 3º botão

    // BLOCO 2: BB vs RFI
    } else if (mode === 'bb-vs-rfi') {
        moduleDesc.innerText = "Um oponente deu Raise. Você está no Big Blind. O que fazer?";
        boardArea.classList.add('hidden');
        configHero.classList.add('hidden'); 
        configVillain.classList.remove('hidden'); 
        
        btnAction1.innerText = 'FOLD'; btnAction1.className = 'btn-action fold';
        btnAction2.innerText = 'CALL'; btnAction2.className = 'btn-action call';
        btnAction3.innerText = '3-BET'; btnAction3.className = 'btn-action raise';
        btnAction3.style.display = 'block';

    // BLOCO 3: BLIND WAR (SB)
    } else if (mode === 'bw-sb') {
        moduleDesc.innerText = "Ação rodou em Fold até você no Small Blind. O que fazer?";
        boardArea.classList.add('hidden');
        configHero.classList.add('hidden');
        configVillain.classList.add('hidden');
        
        btnAction1.innerText = 'FOLD'; btnAction1.className = 'btn-action fold';
        btnAction2.innerText = 'LIMP'; btnAction2.className = 'btn-action call';
        btnAction3.innerText = 'RAISE'; btnAction3.className = 'btn-action raise';
        btnAction3.style.display = 'block';

    // BLOCO 3: BLIND WAR (BB)
    } else if (mode === 'bw-bb') {
        moduleDesc.innerText = "O Small Blind deu Raise. Você está no Big Blind. O que fazer?";
        boardArea.classList.add('hidden');
        configHero.classList.add('hidden');
        configVillain.classList.add('hidden');
        
        btnAction1.innerText = 'FOLD'; btnAction1.className = 'btn-action fold';
        btnAction2.innerText = 'CALL'; btnAction2.className = 'btn-action call';
        btnAction3.innerText = '3-BET'; btnAction3.className = 'btn-action raise';
        btnAction3.style.display = 'block';

    // BLOCO 4: LATE POSITION STEALS
    } else if (mode === 'sb-vs-rfi' || mode === 'btn-vs-rfi') {
        const heroName = mode === 'sb-vs-rfi' ? 'Small Blind' : 'Button';
        moduleDesc.innerText = `Um oponente deu Raise. Você está no ${heroName}. O que fazer?`;
        boardArea.classList.add('hidden');
        configHero.classList.add('hidden');
        configVillain.classList.remove('hidden'); 
        
        const btnOption = document.querySelector('#villain-position option[value="btn"]');
        if (mode === 'btn-vs-rfi') {
            btnOption.disabled = true;
            if (villainSelect.value === 'btn') villainSelect.value = 'co';
        } else {
            btnOption.disabled = false;
        }

        btnAction1.innerText = 'FOLD'; btnAction1.className = 'btn-action fold';
        btnAction2.innerText = 'CALL'; btnAction2.className = 'btn-action call';
        btnAction3.innerText = '3-BET'; btnAction3.className = 'btn-action raise';
        btnAction3.style.display = 'block';

    // OUTROS
    } else {
        moduleDesc.innerText = "Módulo em desenvolvimento... Prepare-se!";
        boardArea.classList.add('hidden');
        configVillain.classList.add('hidden');
        configHero.classList.add('hidden');
    }
}

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
    const deck = getShuffledDeck();
    
    // Distribui 2 cartas para o Hero
    currentHand = [deck[0], deck[1]];
    currentNotation = getHandNotation(currentHand[0], currentHand[1]);
    
    updateCardSlot(slot1, currentHand[0]);
    updateCardSlot(slot2, currentHand[1]);
    
    // Distribui o Flop se estiver no modo C-Bet
    if (currentMode === 'cbet-ip') {
        currentBoard = [deck[2], deck[3], deck[4]];
        updateCardSlot(flop1, currentBoard[0]);
        updateCardSlot(flop2, currentBoard[1]);
        updateCardSlot(flop3, currentBoard[2]);
        scenarioText.innerText = `Você deu Raise e o BB pagou. Flop na mesa. Ação?`;
    } else {
        currentBoard = [];
        clearCardSlot(flop1);
        clearCardSlot(flop2);
        clearCardSlot(flop3);
        
        if (currentMode === 'rfi') scenarioText.innerText = `Posição: ${currentPosition.toUpperCase()}. Qual a sua ação?`;
        else if (currentMode.includes('-vs-rfi')) scenarioText.innerText = `Vilão no ${villainSelect.value.toUpperCase()} deu Raise. Você no ${currentMode.split('-')[0].toUpperCase()}. Ação?`;
        else if (currentMode === 'bw-sb') scenarioText.innerText = `Todos Fold. Você no SB. Ação?`;
        else if (currentMode === 'bw-bb') scenarioText.innerText = `Small Blind deu Raise. Você no BB. Ação?`;
    }
}

// ---- NÚCLEO DO JOGO ----
function handleAction(actionType) {
    if (!isTraining) return;
    
    // Envia a posição, mão e o Flop (board) para o motor matemático
    const result = evaluateAction(currentMode, currentPosition, villainSelect.value, currentNotation, actionType, currentHand, currentBoard);
    
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

// ---- EVENTOS DOS BOTÕES PRINCIPAIS ----
btnStart.addEventListener('click', () => {
    // Lista de módulos permitidos (agora inclui o 'cbet-ip')
    const allowedModes = ['rfi', 'bb-vs-rfi', 'bw-sb', 'bw-bb', 'sb-vs-rfi', 'btn-vs-rfi', 'cbet-ip'];
    if(!allowedModes.includes(currentMode)) {
        alert("Módulo ainda em desenvolvimento.");
        return;
    }

    isTraining = true;
    score = { correct: 0, wrong: 0 };
    scoreCorrectEl.innerText = '0';
    scoreWrongEl.innerText = '0';
    
    // Força a posição internamente
    if (currentMode.includes('-vs-rfi')) {
        currentPosition = currentMode.split('-')[0];
        villainSelect.disabled = true;
    } else if (currentMode === 'bw-sb') {
        currentPosition = 'sb';
    } else if (currentMode === 'bw-bb') {
        currentPosition = 'bb';
    } else if (currentMode === 'cbet-ip') {
        currentPosition = 'ip'; // In Position genérico
    } else {
        currentPosition = posSelect.value;
        posSelect.disabled = true;
    }
    
    btnStart.style.display = 'none';
    btnStop.style.display = 'block';
    actionControls.style.display = 'flex';
    
    feedbackDisplay.classList.remove('success', 'error');
    feedbackText.innerText = `Sessão de treino iniciada! Boa sorte.`;
    
    dealNewHand();
});

btnStop.addEventListener('click', () => {
    isTraining = false;
    posSelect.disabled = false;
    villainSelect.disabled = false;
    
    btnStart.style.display = 'block';
    btnStop.style.display = 'none';
    actionControls.style.display = 'none';
    
    scenarioText.innerText = 'Aguardando início...';
    clearCardSlot(slot1);
    clearCardSlot(slot2);
    clearCardSlot(flop1);
    clearCardSlot(flop2);
    clearCardSlot(flop3);
    
    feedbackDisplay.classList.remove('success', 'error');
    feedbackText.innerText = `Sessão encerrada.`;
});

// Passa a ação em letra minúscula (ex: 'fold', 'bet', 'check')
btnAction1.addEventListener('click', () => handleAction(btnAction1.innerText.toLowerCase()));
btnAction2.addEventListener('click', () => handleAction(btnAction2.innerText.toLowerCase()));
btnAction3.addEventListener('click', () => handleAction(btnAction3.innerText.toLowerCase()));