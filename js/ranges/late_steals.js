// js/ranges/late_steals.js

export const lateStealsRanges = {
    // Hero no Small Blind (SB) vs RFI do Vilão
    sb: {
        utg: {
            threeBet: new Set(['AA','KK','QQ','JJ','AKs','AKo']),
            call: new Set(['TT','99','88','AQs','AJs']) // Range muito tight contra o UTG
        },
        co: {
            threeBet: new Set(['AA','KK','QQ','JJ','TT','99','AKs','AQs','AJs','ATs','KQs','AKo','AQo']),
            call: new Set(['88','77','66','KJs','KTs','QJs','QTs','JTs','T9s','AJo','KQo'])
        },
        btn: {
            threeBet: new Set(['AA','KK','QQ','JJ','TT','99','88','AKs','AQs','AJs','ATs','A9s','KQs','KJs','KTs','QJs','QTs','JTs','AKo','AQo','AJo','ATo','KQo','KJo']),
            call: new Set(['77','66','55','44','A8s','A7s','A6s','A5s','A4s','A3s','A2s','K9s','Q9s','J9s','T9s','98s','87s','76s','QJo','JTo'])
        }
    },
    
    // Hero no Button (BTN) vs RFI do Vilão
    btn: {
        utg: {
            threeBet: new Set(['AA','KK','QQ','JJ','AKs','AQs','AKo']),
            call: new Set(['TT','99','88','77','66','AJs','ATs','KQs','KJs','QJs','JTs','T9s','AQo'])
        },
        co: {
            threeBet: new Set(['AA','KK','QQ','JJ','TT','99','AKs','AQs','AJs','ATs','KQs','KJs','AKo','AQo','AJo']),
            call: new Set(['88','77','66','55','44','33','22','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s','KTs','QJs','QTs','JTs','J9s','T9s','98s','87s','76s','65s','ATo','KQo','KJo','QJo'])
        }
    }
};