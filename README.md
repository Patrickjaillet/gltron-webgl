# 🏍️ GLTron - WebGL Cyberpunk Battle

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Alpha-orange.svg)
![Tech](https://img.shields.io/badge/tech-Three.js-white.svg)

**GLTron** is a high-octane arcade racing game built with **Three.js** and **Vanilla JavaScript**. Inspired by the movie *Tron: Legacy*, it features neon aesthetics, a reflective environment, and a strategic AI opponent.

> **Playable on PC** (Mobile support coming soon).

---

## ✨ Key Features

### 🧠 Strategic AI ("SmartBot")
Unlike simple random bots, the enemy in GLTron is designed to win:
- **Raycasting Vision:** Scans the environment using 5 different sensors.
- **Decision Scoring:** Evaluates survival, free space, and attack opportunities in real-time.
- **Reflexes:** Automatically brakes and turns when facing imminent collision.
- **Aggression:** Actively tries to cut off the player's path.

### 🎨 Visuals & Audio
- **Cyberpunk Aesthetics:** UnrealBloomPass (Neon glow), RGB Shift, and Glitch effects on impact.
- **Reflective Floor:** Real-time reflections using `Reflector` for immersion.
- **Hybrid Audio System:** HTML5 Streaming for music + WebAudio for spatial SFX.
- **Dynamic Pitch:** Engine sound reacts to speed (Turbo vs Braking).

### 🕹️ Gameplay
- **Grid Snapping Physics:** Movement is locked to a grid for precise 90° turns.
- **Turbo Boost:** Consumable energy mechanic for speed bursts.
- **Light Walls:** Leave a deadly trail behind your bike to trap opponents.

---

## 🎮 Controls (PC)

| Action | Key | Description |
| :--- | :---: | :--- |
| **Steer Left** | `←` or `A` | Turn 90° Left |
| **Steer Right** | `→` or `D` | Turn 90° Right |
| **Turbo** | `SPACE` | Boost Speed (Consumes Energy) |
| **Brake** | `↓` or `S` | Slow down for tight turns |
| **Pause** | `P` | Pause/Resume Game |

---

## 🚀 Installation & Setup

This project uses ES6 Modules. Due to CORS policies, you cannot simply open `index.html` in a browser. You need a local server.

### Prerequisites
- [VS Code](https://code.visualstudio.com/)
- [Live Server Extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (Recommended)

### Steps
1. Clone the repository:
   ```bash
   git clone [https://github.com/Patrickjaillet/gltron-webgl.git](https://github.com/Patrickjaillet/gltron-webgl.git)