# RaftJS Auction Web App

This project implements the **Raft consensus algorithm** in JavaScript and uses it as the foundation for a **distributed online auction web application**. Developed for a distributed systems course, it demonstrates how Raft can enforce strong consistency and fault tolerance in a client-server, replicated system.  
The original project report (Dec 2023) explains goals, architecture and implementation decisions.

---

## 📘 Overview

- **Consensus protocol** -> Raft ensures reliable and consistent replication across a cluster of servers using leader election and log replication
- **Web application** -> users can register, create and participate in auctions. All database operations (e.g. bids, item listing) go through the Raft cluster to maintain consistency
- **Architecture**->
  - Raft nodes communicate over HTTP
  - The application uses a relational database (e.g. MySQL) for auctions and users
  - Frontend clients interact via browser/UI
  - The system is deployable on multiple physical/differing nodes or Docker containers.

---

## 🧩 What’s Inside


/
├── docs/
│ └── DS project report.pdf # Detailed project report (Dec 2023)
apice.unibo.it

├── src/ # Source code (node, REST API, Raft implementation)
├── index.js # Entry point (starts node or server)
├── package.json
├── jest.config.mjs # Test config
├── babel.config.json
├── jsdocConf.json
└── presentation.pptx # Slides from project presentation

---

## 🚀 Getting Started

Clone the repo and install dependencies:

```bash
git clone https://github.com/FabioNotaro2001/RaftJS.git
cd RaftJS
npm install

You’ll need a relational database set up (e.g. MySQL). Configure connection settings in your app config or environment variables (e.g. host, port, credentials).
Start a Raft Node
node index.js

    ou can start multiple nodes across different ports or machines to form a cluster.

    Ensure each node is aware of others via a configuration file (e.g. ports/IPs for Raft communication).

Use the Auction Web App

Access via browser at the node’s web server endpoint. Features include:

    User registration/login

    Creating new auctions (with title, description, starting price)

    Displaying open and closed auctions

    Viewing auction details and placing bids

All operations involving write access go through the Raft cluster for consistent replication.
🧪 Testing

Tests are implemented using Jest. Run:
npm test


⚙️ Features & Assumptions

    Raft Consensus: leader election, log replication, consistency.

    Architecture: HTTP-based Raft RPCs, relational database for bidding/auctions.
    apice.unibo.it

    Assumptions:

        Admin configures the cluster (IP/port for each Raft node).
        apice.unibo.it

        At least 5 nodes are assumed for fault tolerance and clear majority.

✅ Summary

This repository provides a distributed auction system built atop an educational implementation of Raft in JavaScript, complete with a web interface, test suite, and project documentation/report. It’s a great showcase of applying consensus protocols to a realistic web service.
