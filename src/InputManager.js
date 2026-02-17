export const ACTIONS = {
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    BOOST: 'BOOST',
    PAUSE: 'PAUSE'
};

export class InputManager {
    constructor() {
        this.actions = ACTIONS;
        this.bindings = this.loadBindings();
        
        // État brut (Raw State)
        this.keysPressed = new Set();
        
        // État traité (Processed State)
        this.state = {
            [ACTIONS.LEFT]: false,
            [ACTIONS.RIGHT]: false,
            [ACTIONS.BOOST]: false,
            [ACTIONS.PAUSE]: false
        };
        this.previousState = { ...this.state };

        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            this.keysPressed.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keysPressed.delete(e.code);
        });

        window.addEventListener('blur', () => this.reset());
    }

    loadBindings() {
        const stored = localStorage.getItem('tron_bindings_kb');
        const defaults = {
            [ACTIONS.LEFT]: 'ArrowLeft',
            [ACTIONS.RIGHT]: 'ArrowRight',
            [ACTIONS.BOOST]: 'Space',
            [ACTIONS.PAUSE]: 'Escape'
        };
        
        if (stored) {
            return { ...defaults, ...JSON.parse(stored) };
        }
        return defaults;
    }

    saveBindings() {
        localStorage.setItem('tron_bindings_kb', JSON.stringify(this.bindings));
    }

    update() {
        // Sauvegarde de l'état précédent pour détection "JustPressed"
        this.previousState = { ...this.state };
        
        // Reset de l'état courant
        for (const action in this.actions) {
            this.state[action] = false;
        }

        // Vérification Clavier
        for (const [action, key] of Object.entries(this.bindings)) {
            if (this.keysPressed.has(key)) {
                this.state[action] = true;
            }
        }

        // Support Hardcoded WASD (Toujours actifs pour robustesse)
        if (this.keysPressed.has('KeyA')) this.state[ACTIONS.LEFT] = true;
        if (this.keysPressed.has('KeyD')) this.state[ACTIONS.RIGHT] = true;
        if (this.keysPressed.has('KeyW')) this.state[ACTIONS.BOOST] = true;
    }

    isActionActive(action) {
        return this.state[action];
    }

    isActionJustPressed(action) {
        return this.state[action] && !this.previousState[action];
    }

    reset() {
        this.keysPressed.clear();
        for (const action in this.state) this.state[action] = false;
    }

    rebind(action, code) {
        // Gestion des conflits : Échange si la touche est déjà prise
        for (const [act, key] of Object.entries(this.bindings)) {
            if (key === code && act !== action) {
                this.bindings[act] = this.bindings[action]; // Swap
            }
        }
        this.bindings[action] = code;
        this.saveBindings();
    }

    getKeyName(action) {
        return this.bindings[action] || '---';
    }

    // Méthode de compatibilité pour l'UI existante (évite crash ControlsMenu)
    getButtonName(action) {
        return 'N/A';
    }
}
