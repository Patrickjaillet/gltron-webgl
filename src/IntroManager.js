export class IntroManager {
    constructor(onComplete, onStart) {
        this.onComplete = onComplete;
        this.onStart = onStart;
        this.finished = false;
        
        this.container = document.createElement('div');
        this.container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:9999;display:flex;justify-content:center;align-items:center;transition:opacity 1s;';
        
        this.video = document.createElement('video');
        this.video.src = './assets/videos/intro.mp4';
        this.video.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        this.video.playsInline = true;
        
        this.button = document.createElement('button');
        this.button.textContent = 'TAP TO START';
        this.button.style.cssText = 'position:absolute;padding:20px 40px;font-size:24px;color:#00ffff;background:transparent;border:2px solid #00ffff;cursor:pointer;font-family:inherit;text-shadow:0 0 5px #00ffff;box-shadow:0 0 10px #00ffff;';
        
        this.container.appendChild(this.video);
        this.container.appendChild(this.button);
        document.body.appendChild(this.container);

        this.button.addEventListener('click', () => {
            if (this.onStart) this.onStart();
            this.button.style.display = 'none';
            this.video.play().catch(() => {});
        });

        this.video.addEventListener('ended', () => this.finish());

        let lastTap = 0;
        this.container.addEventListener('touchstart', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault();
                this.finish();
            }
            lastTap = currentTime;
        });
        this.container.addEventListener('dblclick', () => this.finish());
    }

    finish() {
        if (this.finished) return;
        this.finished = true;
        this.video.pause();
        this.container.style.opacity = '0';
        setTimeout(() => {
            this.container.remove();
            if (this.onComplete) this.onComplete();
        }, 1000);
    }
}