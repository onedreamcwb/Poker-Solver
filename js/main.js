// js/main.js
import { drawRandomHand, getHandNotation } from './utils.js';
import { evaluateAction } from './engine.js';

// ---- MAPEAMENTO DA UI ----
const navItems = document.querySelectorAll('.nav-item');
const moduleTitle = document.getElementById('module-title');
const moduleDesc = document.getElementById('module-description');

const boardArea = document.getElementById('board-area');
const configHero = document.getElementById('config-positions'); // Adicione esta linha
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
    // Trava de segurança se estiver no meio de um treino
    if (isTraining) {
        alert("Por favor, pare a sessão atual antes de trocar de módulo.");
        return;
    }

    currentMode = mode;

    // Atualiza Visual do Menu Lateral
    navItems.forEach(item => item.classList.remove('active'));
    clickedElement.classList.add('active');
    moduleTitle.innerText = `Treinador: ${clickedElement.innerText}`;

    // ---- BLOCO 1: RFI ----
    if (mode === 'rfi') {
        moduleDesc.innerText = "A ação rodou em FOLD até você. Qual a decisão correta?";
        boardArea.classList.add('hidden');
        configVillain.classList.add('hidden');
        configHero.classList.remove('hidden'); 
        
        btnAction1.innerText = 'FOLD'; btnAction1.className = 'btn-action fold';
        btnAction2.innerText = 'CALL'; btnAction2.className = 'btn-action call';
        btnAction3.innerText = 'RAISE'; btnAction3.className = 'btn-action raise';
        btnAction3.style.display = 'block';

    // ---- BLOCO 2: BB vs RFI ----
    } else if (mode === 'bb-vs-rfi') {
        moduleDesc.innerText = "Um oponente deu Raise. Você está no Big Blind. O que fazer?";
        boardArea.classList.add('hidden');
        configHero.classList.add('hidden'); 
        configVillain.classList.remove('hidden'); 
        
        btnAction1.innerText = 'FOLD'; btnAction1.className = 'btn-action fold';
        btnAction2.innerText = 'CALL'; btnAction2.className = 'btn-action call';
        btnAction3.innerText = '3-BET'; btnAction3.className = 'btn-action raise';
        btnAction3.style.display = 'block';

    // ---- BLOCO 3: BLIND WAR (Hero no SB) ----
    } else if (mode === 'bw-sb') {
        moduleDesc.innerText = "Ação rodou em Fold até você no Small Blind. O que fazer?";
        boardArea.classList.add('hidden');
        configHero.classList.add('hidden');
        configVillain.classList.add('hidden');
        
        btnAction1.innerText = 'FOLD'; btnAction1.className = 'btn-action fold';
        btnAction2.innerText = 'LIMP'; btnAction2.className = 'btn-action call'; // Botão LIMP exclusivo
        btnAction3.innerText = 'RAISE'; btnAction3.className = 'btn-action raise';
        btnAction3.style.display = 'block';

    // ---- BLOCO 3: BLIND WAR (Hero no BB) ----
    } else if (mode === 'bw-bb') {
        moduleDesc.innerText = "O Small Blind deu Raise. Você está no Big Blind. O que fazer?";
        boardArea.classList.add('hidden');
        configHero.classList.add('hidden');
        configVillain.classList.add('hidden');
        
        btnAction1.innerText = 'FOLD'; btnAction1.className = 'btn-action fold';
        btnAction2.innerText = 'CALL'; btnAction2.className = 'btn-action call';
        btnAction3.innerText = '3-BET'; btnAction3.className = 'btn-action raise';
        btnAction3.style.display = 'block';

    // ---- BLOCO 4: LATE POSITION STEALS (SB e BTN vs RFI) ----
    } else if (mode === 'sb-vs-rfi' || mode === 'btn-vs-rfi') {
        const heroName = mode === 'sb-vs-rfi' ? 'Small Blind' : 'Button';
        moduleDesc.innerText = `Um oponente deu Raise. Você está no ${heroName}. O que fazer?`;
        boardArea.classList.add('hidden');
        configHero.classList.add('hidden');
        configVillain.classList.remove('hidden'); 
        
        // Bloqueia a opção 'btn' para o vilão se o Hero já for o Button
        const btnOption = document.querySelector('#villain-position option[value="btn"]');
        if (mode === 'btn-vs-rfi') {
            btnOption.disabled = true;
            if (villainSelect.value === 'btn') villainSelect.value = 'co'; // Redireciona se estiver no BTN
        } else {
            btnOption.disabled = false; // SB pode enfrentar o BTN
        }

        btnAction1.innerText = 'FOLD'; btnAction1.className = 'btn-action fold';
        btnAction2.innerText = 'CALL'; btnAction2.className = 'btn-action call';
        btnAction3.innerText = '3-BET'; btnAction3.className = 'btn-action raise';
        btnAction3.style.display = 'block';

    // ---- OUTROS MÓDULOS (Em construção) ----
    } else {
        moduleDesc.innerText = "Módulo em desenvolvimento... Prepare-se!";
        boardArea.classList.add('hidden');
        configVillain.classList.add('hidden');
        configHero.classList.add('hidden');
    }
}

// ---- FUNÇÃO DE DAR AS CARTAS (Textos dinâmicos) ----
function dealNewHand() {
    currentHand = drawRandomHand();
    currentNotation = getHandNotation(currentHand[0], currentHand[1]);
    
    updateCardSlot(slot1, currentHand[0]);
    updateCardSlot(slot2, currentHand[1]);
    
    if (currentMode === 'rfi') {
        scenarioText.innerText = `Posição: ${currentPosition.toUpperCase()}. Qual a sua ação?`;
    } else if (currentMode === 'bb-vs-rfi' || currentMode === 'sb-vs-rfi' || currentMode === 'btn-vs-rfi') {
        const heroLabel = currentMode.split('-')[0].toUpperCase();
        scenarioText.innerText = `Vilão no ${villainSelect.value.toUpperCase()} deu Raise. Você no ${heroLabel}. Ação?`;
    } else if (currentMode === 'bw-sb') {
        scenarioText.innerText = `Todos Fold. Você no SB. Ação?`;
    } else if (currentMode === 'bw-bb') {
        scenarioText.innerText = `Small Blind deu Raise. Você no BB. Ação?`;
    } else {
        scenarioText.innerText = `Cenário carregado. Ação?`;
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

// ---- NÚCLEO DO JOGO ----
function handleAction(actionType) {
    if (!isTraining) return;
    
    // O motor vai avaliar baseado no MODO atual, na sua mão e na sua posição
    const result = evaluateAction(currentMode, currentPosition, villainSelect.value, currentNotation, actionType);
    
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

// ---- EVENTO DO BOTÃO START ----
btnStart.addEventListener('click', () => {
    // 1. Verifica se o módulo atual é um dos 6 módulos Pré-Flop que já programámos
    const preFlopModes = ['rfi', 'bb-vs-rfi', 'bw-sb', 'bw-bb', 'sb-vs-rfi', 'btn-vs-rfi'];
    if(!preFlopModes.includes(currentMode)) {
        alert("Módulo ainda em desenvolvimento. Selecione um módulo do Bloco 1 ao 4.");
        return;
    }

    // 2. Prepara o estado do jogo
    isTraining = true;
    score = { correct: 0, wrong: 0 };
    scoreCorrectEl.innerText = '0';
    scoreWrongEl.innerText = '0';
    
    // 3. Força a Posição do Hero internamente de acordo com o módulo escolhido
    if (currentMode.includes('-vs-rfi')) {
        // Ex: se o modo for 'sb-vs-rfi', ele extrai o 'sb' e define como posição atual
        currentPosition = currentMode.split('-')[0]; 
        villainSelect.disabled = true; // Trava o seletor do vilão durante a sessão
    } else if (currentMode === 'bw-sb') {
        currentPosition = 'sb';
    } else if (currentMode === 'bw-bb') {
        currentPosition = 'bb';
    } else {
        // Módulo RFI clássico: a posição é a que o utilizador escolheu no menu
        currentPosition = posSelect.value;
        posSelect.disabled = true; // Trava o seletor do Hero
    }
    
    // 4. Troca os botões na Interface
    btnStart.style.display = 'none';
    btnStop.style.display = 'block';
    actionControls.style.display = 'flex';
    
    feedbackDisplay.classList.remove('success', 'error');
    feedbackText.innerText = `Sessão de treino iniciada! Boa sorte.`;
    
    // 5. Dá a primeira mão da sessão
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