// js/engine.js
// js/engine.js
import { rfiRanges } from './ranges/rfi.js';
import { bbVsRfiRanges } from './ranges/bb_vs_rfi.js';
import { blindWarRanges } from './ranges/blind_war.js';
import { lateStealsRanges } from './ranges/late_steals.js';
import { logicCBetIP } from './ranges/cbet_ip.js'; 
import { logicBBvsCBet } from './ranges/bb_vs_cbet.js'; // Novo
import { logicBBvsRFIMultiWay } from './ranges/bb_vs_rfi_mw.js'; // Novo

export function evaluateAction(mode, heroPos, villainPos, handNotation, action, handCards = [], boardCards = []) {
    switch (mode) {
        // --- PRÉ-FLOP ---
        case 'rfi': return evaluateRFI(heroPos, handNotation, action);
        case 'bb-vs-rfi': return evaluateBBvsRFI(villainPos, handNotation, action);
        case 'bw-sb': return evaluateBWSB(handNotation, action);
        case 'bw-bb': return evaluateBWBB(handNotation, action);
        case 'sb-vs-rfi': return evaluateLateSteals('sb', villainPos, handNotation, action);
        case 'btn-vs-rfi': return evaluateLateSteals('btn', villainPos, handNotation, action);
        
        case 'bb-vs-rfi-mw': return logicBBvsRFIMultiWay(handNotation, action); // Novo
        
        // --- PÓS-FLOP ---
        case 'cbet-ip': return logicCBetIP(handCards, boardCards, action); 
        case 'bb-vs-cbet': return logicBBvsCBet(handCards, boardCards, action); // Novo
        
        default: return { correct: false, msg: `Módulo em desenvolvimento...` };
    }
}

// ... (Copie e cole abaixo desta linha todas as outras funções: evaluateRFI, evaluateBBvsRFI, evaluateBWSB, evaluateBWBB, evaluateLateSteals, exatamente como estavam no engine.js da mensagem anterior) ...

// ---- LÓGICA DO MÓDULO 1: RFI ----
function evaluateRFI(position, handNotation, action) {
    const isRaiseHand = rfiRanges[position].has(handNotation);
    
    if (action === 'raise') {
        return isRaiseHand 
            ? { correct: true, msg: `Excelente! ${handNotation} é um Raise padrão de ${position.toUpperCase()}.` } 
            : { correct: false, msg: `Erro. ${handNotation} é muito fraco para abrir de ${position.toUpperCase()}. Faça FOLD.` };
    } else if (action === 'fold') {
        return !isRaiseHand 
            ? { correct: true, msg: `Bom Fold. ${handNotation} não joga de ${position.toUpperCase()}.` } 
            : { correct: false, msg: `Erro crítico! ${handNotation} é forte demais para foldar de ${position.toUpperCase()}. Faça RAISE.` };
    } else if (action === 'call') {
        return { correct: false, msg: `Erro! Evite Open Limp. Se a mão for forte, faça RAISE. Se não, FOLD.` };
    }
}

// ---- LÓGICA DO MÓDULO 2: BB vs RFI ----
function evaluateBBvsRFI(villainPos, handNotation, action) {
    if (!bbVsRfiRanges[villainPos]) return { correct: false, msg: `Selecione um Vilão válido.` };
    const should3Bet = bbVsRfiRanges[villainPos].threeBet.has(handNotation);
    const shouldCall = bbVsRfiRanges[villainPos].call.has(handNotation);
    
    if (action === '3-bet') {
        if (should3Bet) return { correct: true, msg: `Perfeito! ${handNotation} é um 3-Bet excelente contra o ${villainPos.toUpperCase()}.` };
        if (shouldCall) return { correct: false, msg: `Excesso de agressividade. ${handNotation} joga melhor de CALL contra o ${villainPos.toUpperCase()}.` };
        return { correct: false, msg: `Erro! ${handNotation} é muito fraco. FOLD.` };
    } else if (action === 'call') {
        if (shouldCall) return { correct: true, msg: `Bom Call! Defenda o BB com ${handNotation}.` };
        if (should3Bet) return { correct: false, msg: `Passivo! ${handNotation} é premium, aplique o 3-BET!` };
        return { correct: false, msg: `Erro. ${handNotation} é fraco para pagar. FOLD.` };
    } else if (action === 'fold') {
        if (!should3Bet && !shouldCall) return { correct: true, msg: `Bom Fold.` };
        return { correct: false, msg: `Fold incorreto. O BB precisa ser defendido com ${handNotation}.` };
    }
}

// ---- LÓGICA DO MÓDULO 3: BLIND WAR (SB) ----
function evaluateBWSB(handNotation, action) {
    const shouldRaise = blindWarRanges.sb.raise.has(handNotation);
    const shouldLimp = blindWarRanges.sb.limp.has(handNotation);
    const act = action === 'limp' ? 'call' : action; 

    if (act === 'raise') {
        if (shouldRaise) return { correct: true, msg: `Correto! Raise para isolar o BB.` };
        if (shouldLimp) return { correct: false, msg: `Excesso. ${handNotation} joga melhor de Limp.` };
        return { correct: false, msg: `Erro! Apenas FOLD.` };
    } else if (act === 'call') {
        if (shouldLimp) return { correct: true, msg: `Bom Limp! Completar o SB é a jogada correta.` };
        if (shouldRaise) return { correct: false, msg: `Passivo! Tem que dar RAISE com ${handNotation}.` };
        return { correct: false, msg: `Erro! FOLD.` };
    } else if (act === 'fold') {
        if (!shouldRaise && !shouldLimp) return { correct: true, msg: `Bom Fold.` };
        return { correct: false, msg: `Fold incorreto! Defenda o SB com ${handNotation}.` };
    }
}

// ---- LÓGICA DO MÓDULO 3: BLIND WAR (BB) ----
function evaluateBWBB(handNotation, action) {
    const should3Bet = blindWarRanges.bb_defense.threeBet.has(handNotation);
    const shouldCall = blindWarRanges.bb_defense.call.has(handNotation);
    
    if (action === '3-bet') {
        if (should3Bet) return { correct: true, msg: `Boa agressividade! Punir o roubo do SB com 3-Bet.` };
        if (shouldCall) return { correct: false, msg: `Muito agressivo. Joga bem apenas de CALL.` };
        return { correct: false, msg: `Erro. FOLD.` };
    } else if (action === 'call') {
        if (shouldCall) return { correct: true, msg: `Correto. Call para defender o BB.` };
        if (should3Bet) return { correct: false, msg: `Passivo demais! Aplique 3-Bet.` };
        return { correct: false, msg: `Fold. Não pague com lixo.` };
    } else if (action === 'fold') {
        if (!should3Bet && !shouldCall) return { correct: true, msg: `Bom Fold.` };
        return { correct: false, msg: `Incorreto. Deve defender com ${handNotation}.` };
    }
}

// ---- LÓGICA DO MÓDULO 4: LATE POSITION STEALS ----
function evaluateLateSteals(heroPos, villainPos, handNotation, action) {
    if (!lateStealsRanges[heroPos][villainPos]) return { correct: false, msg: `Cenário inválido. O Vilão deve estar numa posição anterior.` };
    
    const should3Bet = lateStealsRanges[heroPos][villainPos].threeBet.has(handNotation);
    const shouldCall = lateStealsRanges[heroPos][villainPos].call.has(handNotation);
    
    if (action === '3-bet') {
        if (should3Bet) return { correct: true, msg: `Brilhante! 3-Bet por valor/bluff de ${heroPos.toUpperCase()} vs ${villainPos.toUpperCase()}.` };
        if (shouldCall) return { correct: false, msg: `Agressivo demais. Dê apenas Call em posição com ${handNotation}.` };
        return { correct: false, msg: `Erro. ${handNotation} é FOLD claro.` };
    } else if (action === 'call') {
        if (shouldCall) return { correct: true, msg: `Correto! Pagar o raise para jogar pós-flop com ${handNotation}.` };
        if (should3Bet) return { correct: false, msg: `Passivo! ${handNotation} é forte, aplique o 3-BET!` };
        return { correct: false, msg: `Incorreto. ${handNotation} é lixo, FOLD.` };
    } else if (action === 'fold') {
        if (!should3Bet && !shouldCall) return { correct: true, msg: `Bom Fold. Evite jogar mãos marginais sem posição ou iniciativa.` };
        return { correct: false, msg: `Fold terrível. Mão rentável para jogar contra o ${villainPos.toUpperCase()}.` };
    }
}