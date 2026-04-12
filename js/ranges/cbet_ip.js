// js/ranges/cbet_ip.js

const rankVals = { '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'T':10, 'J':11, 'Q':12, 'K':13, 'A':14 };

function evaluateHandStrength(hand, board) {
    const handRanks = hand.map(c => rankVals[c.rank]).sort((a,b) => b-a);
    const boardRanks = board.map(c => rankVals[c.rank]).sort((a,b) => b-a);
    
    // Forças Absolutas
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

    // Draws (Flush Draw)
    const allCards = [...hand, ...board];
    const suitsCount = { '♠':0, '♥':0, '♦':0, '♣':0 };
    allCards.forEach(c => suitsCount[c.suit]++);
    const hasFlushDraw = Object.values(suitsCount).some(count => count >= 4);

    // Identifica Wet Board (Mesa Molhada / Perigosa)
    // Board é wet se as 3 cartas estiverem muito próximas ou houver 2 ou mais cartas do mesmo naipe
    const isWetBoard = (boardRanks[0] - boardRanks[2] <= 4) || (new Set(board.map(c => c.suit)).size <= 2);
    
    // Mãos Especiais para Sizing de 50%
    const isVulnerableTopPair = hitTopPair && isWetBoard;

    // Classificação Refinada para Sizing GTO
    if (isSet || isTwoPair) return { type: 'monster', name: 'Mão Monstro (2 Pares+)' };
    if (isOverpair) return { type: 'strong', name: 'Overpair' };
    if (isVulnerableTopPair) return { type: 'vulnerable_tp', name: 'Top Pair em Board Molhado' };
    if (hitTopPair) return { type: 'strong', name: 'Top Pair' };
    if (hasFlushDraw) return { type: 'draw', name: 'Flush Draw' };
    if (hitMidPair) return { type: 'medium_value', name: 'Middle Pair' };
    if (hitBottomPair || isPocketPair) return { type: 'marginal', name: 'Par Fraco' };

    return { type: 'air', name: 'Air / Carta Alta' };
}

export function logicCBetIP(hand, board, action) {
    const strength = evaluateHandStrength(hand, board);
    
    // SIZING PEQUENO (33%)
    if (action === 'bet 33%') {
        if (strength.type === 'strong') return { correct: true, msg: `Sizing Perfeito! Aposta pequena (33%) com ${strength.name} extrai valor e mantém os blefes e mãos piores do Vilão no jogo.` };
        if (strength.type === 'monster') return { correct: false, msg: `Sizing incorreto. Você tem ${strength.name}. Deve apostar mais pesado (75%) para extrair valor.` };
        if (strength.type === 'draw') return { correct: false, msg: `Sizing fraco para blefe. Com ${strength.name}, prefira uma aposta grande (75%) para maximizar a sua Fold Equity.` };
        if (strength.type === 'vulnerable_tp') return { correct: false, msg: `Sizing perigoso! Com ${strength.name}, 33% é muito barato e convida os adversários a pagarem com Draws. Prefira 50%.` };
        if (strength.type === 'medium_value') return { correct: true, msg: `Bom sizing. 33% com ${strength.name} funciona bem para proteção e extração fina.` };
        return { correct: false, msg: `Erro! C-Bet agressivo. Você só tem ${strength.name}, controle o pote com Check.` };
        
    // SIZING MÉDIO (50%)
    } else if (action === 'bet 50%') {
        if (strength.type === 'vulnerable_tp') return { correct: true, msg: `Sizing Perfeito! 50% com ${strength.name} protege a sua mão contra Draws e cobra caro por cartas grátis.` };
        if (strength.type === 'medium_value') return { correct: true, msg: `Sizing Perfeito! 50% com ${strength.name} extrai valor de pares piores da forma correta.` };
        if (strength.type === 'strong' || strength.type === 'monster') return { correct: false, msg: `Bom sizing, mas pode ser otimizado. Dependendo da textura, 33% ou 75% geram mais valor com essa mão forte.` };
        if (strength.type === 'draw') return { correct: false, msg: `Sizing estranho para Semi-blefe. O 50% não gera tanto Fold Equity quanto o 75%.` };
        return { correct: false, msg: `Apostar 50% com ${strength.name} queima dinheiro a longo prazo. Prefira o Check.` };

    // SIZING POLARIZADO (75%)
    } else if (action === 'bet 75%') {
        if (strength.type === 'monster') return { correct: true, msg: `Sizing Perfeito! Aposta pesada (75%) com ${strength.name} por valor máximo e para construir um pote gigante.` };
        if (strength.type === 'draw') return { correct: true, msg: `Sizing Perfeito! O Semi-blefe a 75% com ${strength.name} pressiona as mãos médias do Vilão a foldar imediatamente.` };
        if (strength.type === 'strong' || strength.type === 'vulnerable_tp') return { correct: false, msg: `Aposta muito pesada! Com este sizing você vai isolar a sua mão. O Vilão vai foldar mãos piores. Prefira 33% ou 50%.` };
        return { correct: false, msg: `Erro grave! Blefar a 75% sem nenhum Draw (apenas com ${strength.name}) é queimar fichas.` };
        
    // CHECK
    } else if (action === 'check') {
        if (strength.type === 'marginal' || strength.type === 'air' || strength.type === 'medium_value') return { correct: true, msg: `Bom Check! Controlando o pote e realizando equidade grátis com ${strength.name}.` };
        if (strength.type === 'strong' || strength.type === 'monster' || strength.type === 'vulnerable_tp') return { correct: false, msg: `Passivo demais! Você tem ${strength.name}, deve apostar para extrair valor ou proteger.` };
        return { correct: false, msg: `O Check é aceitável, mas com ${strength.name} poderia aplicar agressão num bom spot.` };
    }
    
    return { correct: false, msg: `Ação não reconhecida pelo motor.` };
}