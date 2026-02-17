export class ControlsMenu {
    constructor(container, inputManager) {
        this.container = container;
        this.inputManager = inputManager;
        this.render();
    }

    render() {
        // Injection de style pour forcer le layout 2 colonnes
        this.container.innerHTML = `
            <style>
                .controls-grid, .control-row { grid-template-columns: 1fr 1fr !important; }
            </style>
            <h2>CONTROLS</h2>
            <div class="controls-grid">
                <div class="header">ACTION</div>
                <div class="header">KEYBOARD</div>
            </div>
            <div id="controls-list" class="controls-list"></div>
            <div style="margin-top: 20px; font-size: 0.8rem; color: #888;">
                * WASD & Arrows are always active
            </div>
        `;

        const list = this.container.querySelector('#controls-list');
        // Ordre d'affichage
        const actions = ['LEFT', 'RIGHT', 'BOOST', 'PAUSE'];

        actions.forEach(action => {
            const row = document.createElement('div');
            row.className = 'control-row';
            
            const label = document.createElement('div');
            label.textContent = action;

            const keyBtn = document.createElement('button');
            keyBtn.className = 'bind-btn';
            keyBtn.textContent = this.inputManager.getKeyName(action);
            keyBtn.onclick = () => this.startRebinding(action, keyBtn);

            row.appendChild(label);
            row.appendChild(keyBtn);
            list.appendChild(row);
        });
    }

    startRebinding(action, btnElement) {
        btnElement.textContent = "PRESS KEY...";
        btnElement.classList.add('binding');

        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.removeEventListener('keydown', handler);
            
            this.inputManager.rebind(action, e.code);
            btnElement.classList.remove('binding');
            this.render(); // Re-render pour afficher les échanges (conflits)
        };

        window.addEventListener('keydown', handler, { once: true });
    }
}
