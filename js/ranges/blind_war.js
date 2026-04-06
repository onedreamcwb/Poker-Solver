// js/ranges/blind_war.js

// Ranges GTO Simplificados para Blind War (Guerra de Blinds)
export const blindWarRanges = {
    // Modo: bw-sb (Hero no SB. Ação rodou em fold)
    sb: {
        raise: new Set(['AA','KK','QQ','JJ','TT','99','88','77','AKs','AQs','AJs','ATs','A9s','A8s','KQs','KJs','KTs','QJs','QTs','JTs','AKo','AQo','AJo','ATo','KQo','KJo']),
        limp: new Set(['66','55','44','33','22','A7s','A6s','A5s','A4s','A3s','A2s','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s','Q9s','Q8s','Q7s','Q6s','Q5s','J9s','J8s','J7s','T9s','T8s','T7s','98s','97s','87s','86s','76s','65s','54s','A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o','KTo','K9o','K8o','QJo','QTo','Q9o','JTo','J9o','T9o','98o']),
        // O que não estiver nestes dois sets é FOLD (Ex: 72o, 94o, etc)
    },
    
    // Modo: bw-bb (Hero no BB. SB deu Raise)
    bb_defense: {
        threeBet: new Set(['AA','KK','QQ','JJ','TT','99','AKs','AQs','AJs','ATs','KQs','AKo','AQo','AJo']),
        call: new Set(['88','77','66','55','44','33','22','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s','QJs','QTs','Q9s','Q8s','JTs','J9s','J8s','T9s','T8s','98s','97s','87s','76s','65s','54s','ATo','A9o','A8o','KQo','KJo','KTo','K9o','QJo','QTo','JTo','J9o','T9o'])
    }
};