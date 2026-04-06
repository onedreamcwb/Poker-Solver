// js/engine.js
import { rfiRanges } from './ranges/rfi.js';
import { bbVsRfiRanges } from './ranges/bb_vs_rfi.js';
import { blindWarRanges } from './ranges/blind_war.js'; // Novo import

export function evaluateAction(mode, heroPos, villainPos, handNotation, action) {
    switch (mode) {
        case 'rfi':
            return evaluateRFI(heroPos, handNotation, action);
        case 'bb-vs-rfi':
            return evaluateBBvsRFI(villainPos, handNotation, action);
        case 'bw-sb':
            return evaluateBWSB(handNotation, action); // Nova função SB
        case 'bw-bb':
            return evaluateBWBB(handNotation, action); // Nova função BB
        case 'cbet-ip':
            return { correct: false, msg: `Módulo C-Bet IP em construção.` };
        default:
            return { correct: false, msg: `Módulo em desenvolvimento...` };
    }
}

function evaluateRFI(position, handNotation, action) {
    const isRaiseHand = rfiRanges[position].has(handNotation);
    if (action === 'raise') {
        return isRaiseHand ? { correct: true, msg: `Excelente! ${handNotation} é um Raise padrão de ${position.toUpperCase()}.` } : { correct: false, msg: `Erro. ${handNotation} é muito fraco para abrir de ${position.toUpperCase()}. Faça FOLD.` };
    } else if (action === 'fold') {
        return !isRaiseHand ? { correct: true, msg: `Bom Fold. ${handNotation} não joga de ${position.toUpperCase()}.` } : { correct: false, msg: `Erro crítico! ${handNotation} é forte demais para foldar de ${position.toUpperCase()}. Faça RAISE.` };
    } else if (action === 'call') {
        return { correct: false, msg: `Erro! Evite Open Limp. Se a mão for forte, faça RAISE. Se não, FOLD.` };
    }
}

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
        if (should3Bet) return { correct: false, msg: `Erro passivo! ${handNotation} é premium, aplique o 3-BET!` };
        return { correct: false, msg: `Erro. ${handNotation} é fraco para pagar. FOLD.` };
    } else if (action === 'fold') {
        if (!should3Bet && !shouldCall) return { correct: true, msg: `Bom Fold. Sem força para enfrentar o ${villainPos.toUpperCase()}.` };
        return { correct: false, msg: `Fold incorreto. O BB precisa ser defendido com ${handNotation}.` };
    }
}

// ---- LÓGICA DO MÓDULO 3: BLIND WAR (SB) ----
function evaluateBWSB(handNotation, action) {
    const shouldRaise = blindWarRanges.sb.raise.has(handNotation);
    const shouldLimp = blindWarRanges.sb.limp.has(handNotation);
    
    // Convertemos a string do botão 'LIMP' para 'call'
    const act = action === 'limp' ? 'call' : action; 

    if (act === 'raise') {
        if (shouldRaise) return { correct: true, msg: `Correto! ${handNotation} é forte o suficiente para isolar o BB com Raise.` };
        if (shouldLimp) return { correct: false, msg: `Excesso. ${handNotation} joga melhor de Limp (Completar o BB).` };
        return { correct: false, msg: `Erro! ${handNotation} é lixo. Apenas FOLD.` };
    } else if (act === 'call') {
        if (shouldLimp) return { correct: true, msg: `Bom Limp! Completar o SB com ${handNotation} é a jogada GTO correta.` };
        if (shouldRaise) return { correct: false, msg: `Muito passivo! ${handNotation} é muito forte, tem que dar RAISE.` };
        return { correct: false, msg: `Erro! Nem por 0.5 BB vale a pena jogar ${handNotation}. FOLD.` };
    } else if (act === 'fold') {
        if (!shouldRaise && !shouldLimp) return { correct: true, msg: `Bom Fold. ${handNotation} é fraco demais.` };
        return { correct: false, msg: `Fold incorreto! Não jogue dinheiro fora, defenda o seu SB com ${handNotation}.` };
    }
}

// ---- LÓGICA DO MÓDULO 3: BLIND WAR (BB) ----
function evaluateBWBB(handNotation, action) {
    const should3Bet = blindWarRanges.bb_defense.threeBet.has(handNotation);
    const shouldCall = blindWarRanges.bb_defense.call.has(handNotation);
    
    if (action === '3-bet') {
        if (should3Bet) return { correct: true, msg: `Boa agressividade! Punir o roubo do SB com 3-Bet.` };
        if (shouldCall) return { correct: false, msg: `Muito agressivo. ${handNotation} joga bem apenas de CALL.` };
        return { correct: false, msg: `Erro. ${handNotation} é FOLD.` };
    } else if (action === 'call') {
        if (shouldCall) return { correct: true, msg: `Correto. Call para defender o BB em posição contra o SB.` };
        if (should3Bet) return { correct: false, msg: `Passivo demais! Aplique 3-Bet por valor com ${handNotation}.` };
        return { correct: false, msg: `Fold. Não pague com lixo.` };
    } else if (action === 'fold') {
        if (!should3Bet && !shouldCall) return { correct: true, msg: `Bom Fold.` };
        return { correct: false, msg: `Incorreto. O range do SB é muito amplo, deve defender com ${handNotation}.` };
    }
}