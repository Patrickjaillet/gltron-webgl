export class SaveManager {
    constructor() {
        this.storageKey = 'tron_save_data';
        this.data = {
            highScore: 0,
            settings: {
                musicVolume: 0.5,
                sfxVolume: 0.5,
                postProcessing: true,
                chassisColor: '#00ffff',
                neonColor: '#00ffff',
                difficulty: 'medium',
                quality: 'auto'
            }
        };
        this.load();
    }

    load() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                this.data = {
                    ...this.data,
                    ...parsed,
                    settings: { ...this.data.settings, ...parsed.settings }
                };
            } catch (e) {
                console.error('Failed to load save data', e);
            }
        }
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    getHighScore() {
        return this.data.highScore;
    }

    setHighScore(score) {
        if (score > this.data.highScore) {
            this.data.highScore = score;
            this.save();
            return true;
        }
        return false;
    }

    getSettings() {
        return this.data.settings;
    }

    setSetting(key, value) {
        this.data.settings[key] = value;
        this.save();
    }
}