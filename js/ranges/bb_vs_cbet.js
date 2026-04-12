// js/ranges/bb_vs_cbet.js

const rankVals = { '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'T':10, 'J':11, 'Q':12, 'K':13, 'A':14 };

function evaluateBBDefense(hand, board) {
    const handRanks = hand.map(c => rankVals[c.rank]).sort((a,b) => b-a);
    const boardRanks = board.map(c => rankVals[c.rank]).sort((a,b) => b-a);
    
    // Forças absolutas
    let hitTopPair = false, hitMidPair = false, hitBottomPair = false;
    for (let hr of handRanks) {
        if (hr === boardRanks[0]) hitTopPair = true;
        if (hr === boardRanks[1]) hitMidPair = true;
        if (hr === boardRanks[2]) hitBottomPair = true;
    }
    
    const isPocketPair = handRanks[0] === handRanks[1];
    const isOverpair = isPocketPair && handRanks[0] > boardRanks[0];
    const isTwoPair = (hitTopPair && hitMidPair) || (hitTopPair && hitBottomPair) || (hitMidPair && hitBottomPair) || (handRanks[0] === boardRanks[0] && handRanks[1] === boardRanks[1]);
    const isSet = isPocketPair && boardRanks.includes(handRanks[0]);

    // Draws
    const allCards = [...hand, ...board];
    const suitsCount = { '♠':0, '♥':0, '♦':0, '♣':0 };
    allCards.forEach(c => suitsCount[c.suit]++);
    const hasFlushDraw = Object.values(suitsCount).some(count => count >= 4);

    // Classificação
    if (isSet || isTwoPair) return { type: 'monster', name: 'Mão Monstro (2 Pares+)' };
    if (isOverpair || hitTopPair) return { type: 'strong', name: 'Top Pair / Overpair' };
    if (hasFlushDraw) return { type: 'draw', name: 'Flush Draw' };
    if (hitMidPair || hitBottomPair) return { type: 'marginal', name: 'Par Médio/Baixo' };
    
    return { type: 'air', name: 'Air / Carta Alta' };
}

export function logicBBvsCBet(hand, board, action) {
    const strength = evaluateBBDefense(hand, board);
    
    if (action === 'raise') {
        if (strength.type === 'monster') return { correct: true, msg: `Excelente Check-Raise! Extraindo valor máximo com ${strength.name}.` };
        if (strength.type === 'draw') return { correct: true, msg: `Bom Check-Raise (Semi-bluff)! Colocando pressão com ${strength.name}.` };
        return { correct: false, msg: `Erro! Check-Raise excessivo. Você só tem ${strength.name}.` };
    } 
    else if (action === 'call') {
        if (strength.type === 'strong' || strength.type === 'draw' || strength.type === 'marginal') {
            return { correct: true, msg: `Bom Call! Defendendo o BB com ${strength.name}.` };
        }
        if (strength.type === 'monster') return { correct: false, msg: `Muito passivo! Você tem ${strength.name}, aplique Check-Raise!` };
        return { correct: false, msg: `Erro! Pagar aposta com ${strength.name} é queimar dinheiro. Faça FOLD.` };
    } 
    else if (action === 'fold') {
        if (strength.type === 'air') return { correct: true, msg: `Bom Fold. Nenhuma conexão com o Board (${strength.name}).` };
        return { correct: false, msg: `Fold muito Tight! Você tem ${strength.name}, deve defender (Call ou Raise).` };
    }
}