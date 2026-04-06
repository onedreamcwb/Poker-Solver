// js/engine.js
import { rfiRanges } from './ranges/rfi.js';
import { bbVsRfiRanges } from './ranges/bb_vs_rfi.js';

// ---- AVALIADOR UNIVERSAL GTO ----
export function evaluateAction(mode, heroPos, villainPos, handNotation, action) {
    
    switch (mode) {
        case 'rfi':
            return evaluateRFI(heroPos, handNotation, action);
        
        case 'bb-vs-rfi':
            return evaluateBBvsRFI(villainPos, handNotation, action);
            
        case 'cbet-ip':
            return { correct: false, msg: `Módulo C-Bet IP em construção.` };
            
        default:
            return { correct: false, msg: `Módulo em desenvolvimento...` };
    }
}

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
        return { correct: false, msg: `Erro! Evite Open Limp (Call). Se a mão for forte, faça RAISE. Se não, FOLD.` };
    }
}

// ---- LÓGICA DO MÓDULO 2: BB vs RFI ----
function evaluateBBvsRFI(villainPos, handNotation, action) {
    // Garante que a posição do vilão existe no nosso ficheiro
    if (!bbVsRfiRanges[villainPos]) return { correct: false, msg: `Selecione um Vilão válido (UTG, CO, BTN).` };

    const should3Bet = bbVsRfiRanges[villainPos].threeBet.has(handNotation);
    const shouldCall = bbVsRfiRanges[villainPos].call.has(handNotation);
    
    if (action === '3-bet') {
        if (should3Bet) return { correct: true, msg: `Perfeito! ${handNotation} é um 3-Bet excelente contra o ${villainPos.toUpperCase()}.` };
        if (shouldCall) return { correct: false, msg: `Excesso de agressividade. ${handNotation} joga melhor de CALL contra o ${villainPos.toUpperCase()}.` };
        return { correct: false, msg: `Erro! ${handNotation} é puro lixo contra o ${villainPos.toUpperCase()}. O correto é FOLD.` };
    } 
    else if (action === 'call') {
        if (shouldCall) return { correct: true, msg: `Bom Call! Defenda o BB com ${handNotation} contra o ${villainPos.toUpperCase()}.` };
        if (should3Bet) return { correct: false, msg: `Erro passivo! ${handNotation} é premium. Não faça apenas Call, aplique o 3-BET!` };
        return { correct: false, msg: `Erro. ${handNotation} é muito fraco para pagar um raise do ${villainPos.toUpperCase()}. Faça FOLD.` };
    } 
    else if (action === 'fold') {
        if (!should3Bet && !shouldCall) return { correct: true, msg: `Bom Fold. Sem força para enfrentar o ${villainPos.toUpperCase()}.` };
        return { correct: false, msg: `Fold incorreto. O BB precisa ser defendido com ${handNotation}.` };
    }
}