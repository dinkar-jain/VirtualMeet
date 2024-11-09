# Virtual Meet

This is an interactive virtual meeting platform inspired by **Gather Town**, where users can join a virtual space, move around freely, and interact with others using WebRTC technology. It allows players to connect and chat in real-time, making it a fun and engaging experience for online meetups.

### Demo

You can check out the live demo of the project at [vmeetnow.onrender.com](https://vmeetnow.onrender.com/).

---

## Getting Started

### Prerequisites

To run **Virtual Meet** locally, you need to have **Node.js** and **npm** installed.

1. Install [Node.js](https://nodejs.org/) (which includes npm) if you haven't already.

### Installation

Follow these steps to get the project running on your local machine:

1. Clone the repository:
   ```bash
   git clone https://github.com/dinkar-jain/VirtualMeet.git
   ```

2. Install dependencies:
   ```bash
   cd virtual-meet
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The application should now be running locally. Open your browser and navigate to `http://localhost:3000` to access it.

---

## Notes

- **Dynamic Interactions**: Unlike traditional room-based systems, there are no predefined rooms. Players can instantly interact with others as soon as they are near each other.

- **Performance Considerations**: The default setting for `maxConnections` is 2 in `src/Constants.ts` to prevent overloading your bandwidth with too many peer-to-peer connections. You can increase this value if you need to support more simultaneous connections, but be mindful of your network performance.

- **Location Updates**: Players' locations are only shared after they stop moving for 1 second. This is to reduce unnecessary data transfers and improve efficiency.