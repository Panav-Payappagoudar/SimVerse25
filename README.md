# 🌌 Gravity Sandbox | SimVerse'25
### *Visualizing the Invisible Forces of the Cosmos in Real-Time*

![SimVerse Banner](https://img.shields.io/badge/Hackathon-SimVerse'25-8A2BE2?style=for-the-badge) 
![Team](https://img.shields.io/badge/Team-Meow-FFD700?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Deployed-success?style=for-the-badge)

> **"Gravity is not a force, but a curvature of time and space."** — *Interstellar*

---

## 🚀 The Pitch
Physics textbooks show static diagrams of orbits. But the universe is **chaotic, dynamic, and unpredictable**.

**Gravity Sandbox** is a real-time, collaborative N-Body physics engine that runs directly in your browser. We bridge the gap between abstract equations and visual intuition, allowing users to experience **Chaos Theory**, **Gravity Assists**, and **Orbital Resonance** firsthand.

Unlike standard simulations, this is a **Shared Reality**. Using high-frequency WebSockets, multiple users can join the same room, spawn planets, and watch as their gravitational fields interact in real-time. **It's like Google Docs, but for Astrophysics.**

### 🔗 [Launch Live Simulation](https://orbiting-canvas-3.onrender.com/)
*(Click to enter the sandbox)*

---

## 👥 Team Meow
**Submitted for SimVerse'25 Hackathon** *Organized by ACS & ACM Chapters | VIT-AP University*

| Team Member | Registration | Role |
| :--- | :--- | :--- |
| **Panav Payappagoudar** | 24BCE7077 | Full Stack & Physics Engine |
| **Debarshi Majumber** | 24BCE7692 | UI/UX & Data Architecture |

---

## 🌟 Key Features

### 1. 🤝 Real-Time Collaborative Multiplayer
Built on a **Host-Relay Architecture** using **Socket.io**.
* **Zero-Lag Sync:** When one user modifies a solar system, changes are emitted instantly to all connected clients.
* **Shared Creativity:** One user can be the "Architect" placing stars, while another acts as "Destructor" throwing asteroids to disrupt orbits.
* **Optimistic UI:** Local physics run at 60FPS while syncing state across the network.

### 2. ⚛️ Custom N-Body Physics Engine
We did not use pre-made physics libraries (like Cannon.js). We wrote a custom symplectic integrator from scratch.
* **Newtonian Gravity:** Every object attracts every other object ($F = G \frac{m_1 m_2}{r^2}$).
* **Softening Parameter:** Prevents singularities (infinity errors) when objects collide.
* **Symplectic Euler Integration:** Ensures stable orbits over long durations without energy drift.

### 3. 🎬 "Interstellar" Grade Visuals
* **Accretion Disks:** Procedural shaders mimicking the "Gargantua" black hole.
* **Orbital Trails:** Dynamic line rendering to visualize the history of a planet's path.
* **Bloom & Post-Processing:** Cinematic lighting effects using `@react-three/postprocessing`.

---

## 🛠️ Tech Stack & Architecture

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black) ![Three.js](https://img.shields.io/badge/-Three.js-black?logo=three.js&logoColor=white) | **React Three Fiber** for the 3D scene graph. |
| **Backend** | ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white) ![Socket.io](https://img.shields.io/badge/-Socket.io-black?logo=socket.io&logoColor=white) | **Express + Socket.io** relay server for real-time state synchronization. |
| **Language** | ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black) | Full-stack JS implementation. |
| **Build Tool** | ![Vite](https://img.shields.io/badge/-Vite-646CFF?logo=vite&logoColor=white) | Ultra-fast HMR and bundling. |

### The "Host-Relay" Logic
To ensure performance, we don't run physics on the server.
1.  **The Host:** The first user to join becomes the "Host". Their browser calculates the physics (CPU).
2.  **The Relay:** The Host emits positions to the Server.
3.  **The Guests:** The Server broadcasts these positions to all other users (Guests), who purely render the visuals.

---

## 🏗️ Project Structure

```bash
src/
├── components/
│   ├── BlackHole.jsx     # Shader-based central gravitational anchor
│   ├── Stars.jsx         # InstancedMesh for high-performance rendering
│   ├── SpacetimeGrid.jsx # Visualizes gravity wells (Einstein grid)
│   └── UI.jsx            # Leva controls for G-constant & Time Scale
├── engine/
│   └── Physics.js        # The custom Euler Integration loop
├── server/
│   └── server.js         # Socket.io real-time relay logic
├── App.jsx               # Main Canvas entry point
└── main.jsx              # React DOM root
```

---

## 🚀 Local Installation

Want to run the simulation locally?

1.  **Clone the Repo**
    ```bash
    git clone [https://github.com/Panav-Payappagoudar/SimVerse25.git](https://github.com/Panav-Payappagoudar/SimVerse25.git)
    cd SimVerse25
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    *Open `http://localhost:5173` to view the simulation.*

---

## 🧮 Physics Implementation Details

For the technically curious, here is the core logic governing our universe:

**The Law of Universal Gravitation:**
We calculate the force vector between every pair of bodies $(i, j)$:

$$\vec{F}_{ij} = G \frac{m_i m_j}{|\vec{r}_{ij}|^2 + \epsilon^2} \hat{r}_{ij}$$

*(Note the $\epsilon$ softening parameter added to avoid division by zero during collisions)*

**Integration Strategy:**
We use a **Semi-Implicit Euler** approach for stability:
1.  $\vec{v}_{t+1} = \vec{v}_t + \vec{a}(\vec{x}_t) \cdot \Delta t$
2.  $\vec{x}_{t+1} = \vec{x}_t + \vec{v}_{t+1} \cdot \Delta t$

---

## 🙏 Acknowledgments

* **SimVerse'25 Organizers** (ACS & ACM Chapters) for the platform.
* **Three.js Community** for the incredible open-source graphics tools.
* **Newton & Einstein** for the math.

---

*Built with ❤️ and ☕ by Team Meow*
