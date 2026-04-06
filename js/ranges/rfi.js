// js/ranges/rfi.js

// Ranges GTO de RFI (Raise First In)
export const rfiRanges = {
    utg: new Set(['AA','KK','QQ','JJ','TT','99','88','77', 'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s', 'KQs','KJs','KTs','K9s', 'QJs','QTs','JTs','T9s','98s', 'AKo','AQo','AJo','KQo']),
    mp: new Set(['AA','KK','QQ','JJ','TT','99','88','77','66','55', 'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s', 'KQs','KJs','KTs','K9s','K8s', 'QJs','QTs','Q9s', 'JTs','J9s','T9s','98s','87s', 'AKo','AQo','AJo','ATo','KQo','KJo']),
    co: new Set(['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22', 'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s', 'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s', 'QJs','QTs','Q9s','Q8s', 'JTs','J9s','J8s', 'T9s','T8s','98s','97s','87s','76s','65s','54s', 'AKo','AQo','AJo','ATo','A9o', 'KQo','KJo','KTo','QJo','QTo','JTo']),
    btn: new Set(['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22', 'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s', 'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s', 'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s','Q4s','Q3s','Q2s', 'JTs','J9s','J8s','J7s', 'T9s','T8s','T7s', '98s','97s','96s', '87s','86s', '76s','75s', '65s','54s','43s', 'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o', 'KQo','KJo','KTo','K9o', 'QJo','QTo','Q9o', 'JTo','J9o','T9o','98o']),
    sb: new Set(['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22', 'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s', 'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s', 'QJs','QTs','Q9s','Q8s','Q7s', 'JTs','J9s','J8s', 'T9s','T8s', '98s','97s', '87s', '76s', '65s', 'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o', 'KQo','KJo','KTo','K9o', 'QJo','QTo','Q9o', 'JTo','J9o','T9o'])
};
