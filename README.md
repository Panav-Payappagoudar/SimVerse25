# 🌌 Gravity Sandbox | SimVerse'25
### *Visualizing the Invisible Forces of the Cosmos in Real-Time*

![SimVerse Banner](https://img.shields.io/badge/Hackathon-SimVerse'25-8A2BE2?style=for-the-badge) 
![Team](https://img.shields.io/badge/Team-Meow-FFD700?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Deployed-success?style=for-the-badge)

> **"Gravity is not a force, but a curvature of time and space."** — *Interstellar*

---

## 🧪 The "Magic" Moment (Try This First!)
**Don't just watch—experience the synchronization.**

1.  Open the **[Live Demo](https://orbiting-canvas-3.onrender.com/)** in your current browser.
2.  Open the **same link** in a **second window** (or on your phone/friend's laptop).
3.  **Add a Star** on the first screen.
4.  **Boom.** Watch it appear instantly on the second screen. 

Every movement, every new planet, and every gravitational shift is synced across all connected devices in milliseconds. It’s not just a simulation; it’s a shared universe.

---

## 🚀 The Pitch: A New Way to Teach Physics
Imagine a physics classroom where the whiteboard comes alive. 

* **The Teacher** adds a massive Black Hole in the center of the screen on their laptop.
* **The Student**, sitting across the room on their iPad, instantly sees the class's solar system warp into a new orbit.
* The Student asks, *"What happens if I throw a moon here?"* and drags a new body into the simulation.
* The Teacher and the whole class watch together as the moon enters a stable orbit—or crashes spectacularly.

**Gravity Sandbox** bridges the gap between abstract equations and visual intuition. It transforms Physics from a solitary calculation into a **collaborative, interactive discussion**. It is like Google Docs, but for Astrophysics.

---

## 👥 Team Meow
**Submitted for SimVerse'25 Hackathon** *Organized by ACS & ACM Chapters | VIT-AP University*

| Team Member | Registration | Role |
| :--- | :--- | :--- |
| **Panav Payappagoudar** | 24BCE7077 | UI-UX & Physics Engine |
| **Debarshi Majumber** | 24BCE7692 | Backend & Data Architecture |

---

## 🌟 Key Features

### 1. 🤝 Real-Time Collaborative Multiplayer
Built on a **Host-Relay Architecture** using **Socket.io**.
* **Instant Sync:** If User A adds a star, User B sees it generate immediately.
* **Shared Creativity:** Collaborative world-building where multiple users can design (or destroy) a solar system together.
* **Optimistic UI:** Local physics run at 60FPS while syncing state across the network, ensuring zero lag for the user.

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

If you want to run the simulation locally or contribute to the code:

**1. Clone the Repo**
```bash
git clone https://github.com/Panav-Payappagoudar/SimVerse25.git
cd SimVerse25
```

**2. Install Dependencies**
```bash
npm install
```

**3. Run Development Server**
```bash
npm run dev
```

**4. Launch**
Open `http://localhost:5173` to view the simulation.

### Building for Production
To build the project for production deployment:
```bash
npm run build
```
The built files will be placed in the `dist/` directory.

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

## 🙏 Acknowledgments & Credits

This project was passionately developed during the **24-hour SimVerse'25 Hackathon**, organized by the **ACS & ACM Chapters** at **VIT-AP University**.

We would like to extend our sincere gratitude to the organizers for providing this platform to innovate. It pushed us to learn WebSocket architecture, 3D shader mathematics, and orbital mechanics in a single day.

**Explore the cosmos with us:**
### 🔗 [Launch Live Simulation](https://orbiting-canvas-3.onrender.com/)

---

*Built with ❤️ and ☕ by Team Meow*
