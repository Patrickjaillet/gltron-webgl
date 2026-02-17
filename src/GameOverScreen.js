export class GameOverScreen {
    constructor(assetManager, callbacks) {
        this.container = document.createElement('div');
        this.container.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:none;flex-direction:column;justify-content:center;align-items:center;z-index:20;background:rgba(0,0,0,0.6);font-family:"GameFont",sans-serif;';
        
        this.video = assetManager.get('staticNoise');
        if (this.video) {
            this.video.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0.5;z-index:-1;pointer-events:none;';
            this.container.appendChild(this.video);
        }

        const title = document.createElement('h1');
        title.textContent = 'SYSTEM FAILURE';
        title.style.cssText = 'color:#ff0000;font-size:4rem;margin:0 0 20px 0;text-shadow:0 0 20px #ff0000;text-align:center;animation:glitch 0.3s infinite;';
        this.container.appendChild(title);

        this.statsContainer = document.createElement('div');
        this.statsContainer.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin-bottom:30px;font-size:1.5rem;color:#fff;text-align:center;text-shadow:0 0 5px #fff;';
        this.container.appendChild(this.statsContainer);

        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display:flex;gap:20px;';
        
        const retryBtn = this.createButton('RETRY');
        retryBtn.onclick = () => {
            this.hide();
            callbacks.onRetry();
        };
        
        const menuBtn = this.createButton('MAIN MENU');
        menuBtn.onclick = () => {
            this.hide();
            callbacks.onMenu();
        };

        btnContainer.appendChild(retryBtn);
        btnContainer.appendChild(menuBtn);
        this.container.appendChild(btnContainer);

        document.body.appendChild(this.container);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes glitch {
                0% { transform: translate(0) }
                20% { transform: translate(-2px, 2px) }
                40% { transform: translate(-2px, -2px) }
                60% { transform: translate(2px, 2px) }
                80% { transform: translate(2px, -2px) }
                100% { transform: translate(0) }
            }
        `;
        document.head.appendChild(style);
    }

    createButton(text) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = 'background:transparent;border:2px solid #ff0000;color:#ff0000;padding:15px 30px;font-size:1.2rem;font-family:inherit;cursor:pointer;transition:all 0.2s;text-shadow:0 0 5px #ff0000;box-shadow:0 0 10px #ff0000;';
        btn.onmouseenter = () => {
            btn.style.background = '#ff0000';
            btn.style.color = '#000';
        };
        btn.onmouseleave = () => {
            btn.style.background = 'transparent';
            btn.style.color = '#ff0000';
        };
        return btn;
    }

    show(score, time, maxSpeed) {
        this.container.style.display = 'flex';
        if (this.video) this.video.play();
        
        this.statsContainer.innerHTML = '';
        this.addStat('SCORE', score);
        this.addStat('SURVIVAL TIME', time, true, 's');
        this.addStat('MAX SPEED', maxSpeed);
    }

    addStat(label, value, isFloat = false, suffix = '') {
        const div = document.createElement('div');
        div.textContent = `${label}: ${isFloat ? value.toFixed(2) : Math.floor(value)}${suffix}`;
        this.statsContainer.appendChild(div);
    }

    hide() {
        this.container.style.display = 'none';
        if (this.video) this.video.pause();
    }
}