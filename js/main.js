import { UIController } from './ui.js';
import { MonteCarloEngine } from './engine.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Sistema] Inicializando Poker Study Solver Pro...');
    
    // 1. Inicia o controlador visual
    const ui = new UIController();
    
    // 2. Inicia o motor injetando a UI (Dependency Injection)
    const engine = new MonteCarloEngine(ui);
    
    console.log('[Sistema] Engine e UI sincronizados. Pronto para simulações.');
});