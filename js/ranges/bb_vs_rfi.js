// js/ranges/bb_vs_rfi.js

// Ranges GTO de Defesa do Big Blind (Hero no BB vs Raise do Vilão)
export const bbVsRfiRanges = {
    // Vilão no UTG (Early Position - Range muito forte)
    utg: {
        threeBet: new Set(['AA','KK','QQ','JJ','AKs','AKo','AQs']),
        call: new Set(['TT','99','88','77','66','55','AJs','ATs','A9s','KQs','KJs','KTs','QJs','QTs','JTs','T9s','98s','AQo','AJo'])
    },
    // Vilão no Cutoff (Late Position - Range médio/amplo)
    co: {
        threeBet: new Set(['AA','KK','QQ','JJ','TT','AKs','AKo','AQs','AJs','KQs']),
        call: new Set(['99','88','77','66','55','44','33','22','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s','KJs','KTs','K9s','QJs','QTs','Q9s','JTs','J9s','T9s','98s','87s','76s','AQo','AJo','ATo','KQo','KJo'])
    },
    // Vilão no Button (Late Position - Range muito amplo, tentativa de roubo)
    btn: {
        threeBet: new Set(['AA','KK','QQ','JJ','TT','99','AKs','AQs','AJs','ATs','KQs','AKo','AQo','AJo','KQo']),
        call: new Set(['88','77','66','55','44','33','22','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s','KJs','KTs','K9s','K8s','K7s','QJs','QTs','Q9s','JTs','J9s','T9s','98s','87s','76s','65s','54s','ATo','A9o','A8o','KJo','KTo','QJo','QTo','JTo'])
    }
};