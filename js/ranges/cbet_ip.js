// js/ranges/cbet_ip.js

const rankVals = { '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'T':10, 'J':11, 'Q':12, 'K':13, 'A':14 };

function evaluateHandStrength(hand, board) {
    const handRanks = hand.map(c => rankVals[c.rank]).sort((a,b) => b-a);
    const boardRanks = board.map(c => rankVals[c.rank]).sort((a,b) => b-a);
    
    const isPocketPair = handRanks[0] === handRanks[1];
    if (isPocketPair && handRanks[0] > boardRanks[0]) return { type: 'strong', name: 'Overpair' };

    let hitTopPair = false;
    let hitMidPair = false;
    
    for (let hr of handRanks) {
        if (hr === boardRanks[0]) hitTopPair = true;
        if (hr === boardRanks[1]) hitMidPair = true;
    }
    
    if (hitTopPair) return { type: 'strong', name: 'Top Pair' };
    
    const allCards = [...hand, ...board];
    const suitsCount = { '♠':0, '♥':0, '♦':0, '♣':0 };
    allCards.forEach(c => suitsCount[c.suit]++);
    const hasFlushDraw = Object.values(suitsCount).some(count => count >= 4);
    
    if (hasFlushDraw) return { type: 'draw', name: 'Flush Draw' };
    
    if (hitMidPair) return { type: 'marginal', name: 'Middle Pair' };
    if (isPocketPair) return { type: 'marginal', name: 'Pocket Pair Fraco' };

    return { type: 'air', name: 'Air / Carta Alta' };
}

export function logicCBetIP(hand, board, action) {
    const strength = evaluateHandStrength(hand, board);
    const isBet = action === 'bet' || action === 'raise'; 
    const isCheck = action === 'check' || action === 'fold';
    
    if (isBet) {
        if (strength.type === 'strong' || strength.type === 'draw') {
            return { correct: true, msg: `Excelente C-Bet! Apostar por valor/semi-bluff com ${strength.name}.` };
        } else {
            return { correct: false, msg: `Erro! C-Bet agressivo demais. Jogue de Check com ${strength.name}.` };
        }
    } else if (isCheck) {
        if (strength.type === 'marginal' || strength.type === 'air') {
            return { correct: true, msg: `Bom Check! Controlando o pote com ${strength.name}.` };
        } else {
            return { correct: false, msg: `Muito passivo! Você tem ${strength.name}. Deve fazer C-BET para extrair valor.` };
        }
    }
}