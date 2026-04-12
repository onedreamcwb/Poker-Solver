// js/main.js
import { getShuffledDeck, getHandNotation } from './utils.js';
import { evaluateAction } from './engine.js';
import { MonteCarlo } from './montecarlo.js';
import { rfiRanges } from './ranges/rfi.js'; 

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

// Botões do Monte Carlo e Próxima Mão
const btnRunMC = document.getElementById('btn-run-mc');
const btnNextHand = document.getElementById('btn-next-hand');
const mcResults = document.getElementById('mc-results');
const resEquity = document.getElementById('res-equity');
const mcIterations = document.getElementById('mc-iterations');
const mcProgress = document.getElementById('mc-progress');

// ---- ESTADO GLOBAL ----
let currentMode = 'rfi'; 
let isTraining = false;
let isWaitingForNext = false; // <-- Nova Trava de Segurança
let currentHand = [];
let currentBoard = [];
let currentNotation = '';
let currentPosition = '';
let score = { correct: 0, wrong: 0 };

// ---- CONTROLADOR DE NAVEGAÇÃO ----
function switchMode(mode, clickedElement) {
    if (isTraining) {
        alert("Por favor, pare a sessão atual antes de trocar de módulo.");
        return;
    }

    currentMode = mode;
    navItems.forEach(item => item.classList.remove('active'));
    clickedElement.classList.add('active');
    moduleTitle.innerText = `Treinador: ${clickedElement.innerText}`;

    boardArea.classList.add('hidden');
    configHero.classList.add('hidden');
    configVillain.classList.add('hidden');
    btnAction3.style.display = 'block';
    
    btnAction1.innerText = 'FOLD'; btnAction1.className = 'btn-action fold';
    btnAction2.innerText = 'CALL'; btnAction2.className = 'btn-action call';
    btnAction3.innerText = 'RAISE'; btnAction3.className = 'btn-action raise';

    if (mode === 'rfi') {
        moduleDesc.innerText = "A ação rodou em FOLD até você. Ação?";
        configHero.classList.remove('hidden'); 
    } else if (mode === 'bb-vs-rfi') {
        moduleDesc.innerText = "Um oponente deu Raise. Você no BB. Ação?";
        configVillain.classList.remove('hidden'); 
        btnAction3.innerText = '3-BET';
    } else if (mode === 'bb-vs-rfi-mw') {
        moduleDesc.innerText = "Um Vilão deu Raise, outro pagou. Você no BB. Ação?";
        btnAction3.innerText = 'SQUEEZE'; 
    } else if (mode === 'bw-sb') {
        moduleDesc.innerText = "Ação rodou em Fold até o seu SB. Ação?";
        btnAction2.innerText = 'LIMP'; 
    } else if (mode === 'bw-bb') {
        moduleDesc.innerText = "O Small Blind deu Raise. Você no BB. Ação?";
        btnAction3.innerText = '3-BET';
    } else if (mode === 'sb-vs-rfi' || mode === 'btn-vs-rfi') {
        moduleDesc.innerText = `Um oponente deu Raise. Você está no ${mode === 'sb-vs-rfi' ? 'SB' : 'BTN'}. Ação?`;
        configVillain.classList.remove('hidden'); 
        btnAction3.innerText = '3-BET';
    } else if (mode === 'cbet-ip') {
        moduleDesc.innerText = "Você deu Raise pré-flop e o BB pagou. Flop na mesa. Ação?";
        boardArea.classList.remove('hidden'); 
        btnAction1.innerText = 'CHECK';
        btnAction2.innerText = 'BET'; btnAction2.className = 'btn-action raise';
        btnAction3.style.display = 'none';
    } else if (mode === 'bb-vs-cbet') { 
        moduleDesc.innerText = "O Vilão aposta no Flop. Você no BB. Ação?";
        boardArea.classList.remove('hidden'); 
    } else {
        moduleDesc.innerText = "Em desenvolvimento...";
    }
}

navItems.forEach(item => item.addEventListener('click', (e) => switchMode(e.target.dataset.mode, e.target)));

// ---- FUNÇÕES VISUAIS ----
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
    currentHand = [deck[0], deck[1]];
    currentNotation = getHandNotation(currentHand[0], currentHand[1]);
    
    updateCardSlot(slot1, currentHand[0]);
    updateCardSlot(slot2, currentHand[1]);
    
    if (currentMode === 'cbet-ip' || currentMode === 'bb-vs-cbet') {
        currentBoard = [deck[2], deck[3], deck[4]];
        updateCardSlot(flop1, currentBoard[0]);
        updateCardSlot(flop2, currentBoard[1]);
        updateCardSlot(flop3, currentBoard[2]);
        scenarioText.innerText = currentMode === 'cbet-ip' ? "Flop na mesa. Você aposta ou dá mesa?" : "Vilão aposta. O que você faz?";
    } else {
        currentBoard = [];
        clearCardSlot(flop1); clearCardSlot(flop2); clearCardSlot(flop3);
        
        if (currentMode === 'bb-vs-rfi-mw') scenarioText.innerText = `Pote Multi-way. Você no BB. Ação?`;
        else if (currentMode === 'rfi') scenarioText.innerText = `Posição: ${currentPosition.toUpperCase()}. Qual a sua ação?`;
        else if (currentMode.includes('-vs-rfi')) scenarioText.innerText = `Vilão no ${villainSelect.value.toUpperCase()} deu Raise. Você no ${currentMode.split('-')[0].toUpperCase()}. Ação?`;
        else if (currentMode === 'bw-sb') scenarioText.innerText = `Todos Fold. Você no SB. Ação?`;
        else if (currentMode === 'bw-bb') scenarioText.innerText = `Small Blind deu Raise. Você no BB. Ação?`;
    }

    // Libera os botões de ação para jogar
    isWaitingForNext = false;
    btnAction1.disabled = false;
    btnAction2.disabled = false;
    btnAction3.disabled = false;
}

// ---- NÚCLEO DO JOGO ----
function handleAction(actionType) {
    // Se o jogo está pausado à espera de "Próxima Mão", ignora os cliques
    if (!isTraining || isWaitingForNext) return;
    
    // Trava os botões
    isWaitingForNext = true;
    btnAction1.disabled = true;
    btnAction2.disabled = true;
    btnAction3.disabled = true;

    const result = evaluateAction(currentMode, currentPosition, villainSelect.value, currentNotation, actionType, currentHand, currentBoard);
    
    feedbackDisplay.classList.remove('success', 'error');
    if (result.correct) {
        score.correct++; scoreCorrectEl.innerText = score.correct; feedbackDisplay.classList.add('success');
    } else {
        score.wrong++; scoreWrongEl.innerText = score.wrong; feedbackDisplay.classList.add('error');
    }
    
    feedbackText.innerText = result.msg;
    
    // Mostra os botões de Análise e Próxima Mão
    btnRunMC.style.display = 'block';
    if(btnNextHand) btnNextHand.style.display = 'block';
    mcResults.classList.add('hidden');
}

// ---- EVENTOS DOS BOTÕES ----
btnStart.addEventListener('click', () => {
    const allowedModes = ['rfi', 'bb-vs-rfi', 'bb-vs-rfi-mw', 'bw-sb', 'bw-bb', 'sb-vs-rfi', 'btn-vs-rfi', 'cbet-ip', 'bb-vs-cbet'];
    if(!allowedModes.includes(currentMode)) { alert("Módulo em desenvolvimento."); return; }

    isTraining = true;
    isWaitingForNext = false;
    score = { correct: 0, wrong: 0 };
    scoreCorrectEl.innerText = '0'; scoreWrongEl.innerText = '0';
    
    if (currentMode.includes('bb-vs')) currentPosition = 'bb';
    else if (currentMode === 'bw-sb' || currentMode === 'sb-vs-rfi') currentPosition = 'sb';
    else if (currentMode === 'btn-vs-rfi') currentPosition = 'btn';
    else if (currentMode === 'cbet-ip') currentPosition = 'ip';
    else currentPosition = posSelect.value;
    
    posSelect.disabled = true;
    villainSelect.disabled = true;
    
    btnStart.style.display = 'none'; 
    btnStop.style.display = 'block'; 
    actionControls.style.display = 'flex';
    
    // Esconde os botões extras se existirem
    btnRunMC.style.display = 'none';
    if(btnNextHand) btnNextHand.style.display = 'none';
    mcResults.classList.add('hidden');

    feedbackDisplay.classList.remove('success', 'error');
    feedbackText.innerText = `Sessão de treino iniciada!`;
    dealNewHand();
});

btnStop.addEventListener('click', () => {
    isTraining = false;
    posSelect.disabled = false; villainSelect.disabled = false;
    btnStart.style.display = 'block'; btnStop.style.display = 'none'; actionControls.style.display = 'none';
    scenarioText.innerText = 'Aguardando início...';
    clearCardSlot(slot1); clearCardSlot(slot2); clearCardSlot(flop1); clearCardSlot(flop2); clearCardSlot(flop3);
    feedbackDisplay.classList.remove('success', 'error');
    feedbackText.innerText = `Sessão encerrada.`;
    
    btnRunMC.style.display = 'none';
    if(btnNextHand) btnNextHand.style.display = 'none';
    mcResults.classList.add('hidden');
});

// Ações do Jogo
btnAction1.addEventListener('click', () => handleAction(btnAction1.innerText.toLowerCase()));
btnAction2.addEventListener('click', () => handleAction(btnAction2.innerText.toLowerCase()));
btnAction3.addEventListener('click', () => handleAction(btnAction3.innerText.toLowerCase()));

// Botão "Próxima Mão"
if(btnNextHand) {
    btnNextHand.addEventListener('click', () => {
        btnRunMC.style.display = 'none';
        btnNextHand.style.display = 'none';
        mcResults.classList.add('hidden');
        
        feedbackDisplay.classList.remove('success', 'error');
        feedbackText.innerText = "Avaliando nova mão...";
        dealNewHand();
    });
}

// ---- MOTOR DE MONTE CARLO (UI LIGAÇÃO) ----
// ---- MOTOR DE MONTE CARLO (UI LIGAÇÃO) ----
btnRunMC.addEventListener('click', () => {
    btnRunMC.disabled = true;
    btnRunMC.innerText = "Simulando 10.000 cenários...";
    mcResults.classList.remove('hidden');
    
    let villainRangeSet = new Set();
    let vsText = "Random Hand"; // Texto padrão
    
    if (currentMode === 'bb-vs-rfi' || currentMode.includes('vs-rfi')) {
        // Se estamos a defender, o Vilão tem o range da posição que ele abriu
        villainRangeSet = rfiRanges[villainSelect.value];
        vsText = `Range do ${villainSelect.value.toUpperCase()}`;
        
    } else if (currentMode === 'rfi') {
        // NOVO: Se estamos a abrir (RFI), simulamos contra quem nos daria Call (Usamos o Range do Button como um bom proxy de Call/Defesa)
        villainRangeSet = rfiRanges['btn']; 
        vsText = "Calling Range (BTN)";
        
    } else if (currentMode === 'cbet-ip') {
        // Pós-Flop (Por enquanto avalia contra random, pode ser refinado no futuro)
        villainRangeSet = new Set(); 
        vsText = "Random Hand";
    }

    // Atualiza o texto na UI para sabermos contra o que estamos a simular
    const equityLabel = document.querySelector('#mc-results .result-label');
    if(equityLabel) equityLabel.innerText = `Sua Equity vs ${vsText}:`;

    MonteCarlo.run(
        currentHand, 
        currentBoard, 
        villainRangeSet, 
        10000, 
        (current, total) => {
            mcIterations.innerText = current;
            mcProgress.style.width = `${(current / total) * 100}%`;
        }, 
        (equity) => {
            resEquity.innerText = `${(equity * 100).toFixed(2)}%`;
            btnRunMC.disabled = false;
            btnRunMC.innerText = "Analisar Novamente";
        }
    );
});
