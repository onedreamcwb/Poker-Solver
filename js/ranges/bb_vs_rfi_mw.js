// js/ranges/bb_vs_rfi_mw.js

export const bbVsRfiMwRanges = {
    // Squeeze: O nosso "3-Bet" contra múltiplos jogadores (Range super premium)
    squeeze: new Set(['AA','KK','QQ','JJ','AKs','AKo','AQs']),
    // Call: Excelentes pot odds, jogamos por valor especulativo
    call: new Set(['TT','99','88','77','66','55','44','33','22','AJs','ATs','A9s','A8s','KQs','KJs','KTs','QJs','QTs','JTs','J9s','T9s','98s','87s','76s','65s','54s'])
    // O resto é FOLD (Ex: AJo, KQo, etc, perdem muito valor em potes multi-way)
};

export function logicBBvsRFIMultiWay(handNotation, action) {
    const shouldSqueeze = bbVsRfiMwRanges.squeeze.has(handNotation);
    const shouldCall = bbVsRfiMwRanges.call.has(handNotation);
    
    const act = action === 'squeeze' ? 'raise' : action; // Mapeia o botão Squeeze para Raise

    if (act === 'raise') {
        if (shouldSqueeze) return { correct: true, msg: `Perfeito! Squeeze punitivo num pote Multi-Way com ${handNotation}.` };
        return { correct: false, msg: `Erro. ${handNotation} não tem equidade suficiente para Squeeze Multi-Way.` };
    } else if (act === 'call') {
        if (shouldCall) return { correct: true, msg: `Bom Call! As Pot Odds justificam defender ${handNotation} Multi-Way.` };
        if (shouldSqueeze) return { correct: false, msg: `Passivo! ${handNotation} é premium. Esmague o pote com SQUEEZE.` };
        return { correct: false, msg: `Erro (Overcall). ${handNotation} joga muito mal contra vários oponentes. FOLD.` };
    } else if (act === 'fold') {
        if (!shouldSqueeze && !shouldCall) return { correct: true, msg: `Bom Fold disciplinado.` };
        return { correct: false, msg: `Fold incorreto. O pote está a dar-lhe excelentes Odds para pagar com ${handNotation}.` };
    }
}