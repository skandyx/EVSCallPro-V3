# Contact Center Backend

This directory contains the Node.js backend application that powers the contact center solution. It serves two primary functions:

1.  **API Server (Future)**: An HTTP API for the React frontend to save and load configurations (users, scripts, IVR flows, etc.) from the PostgreSQL database.
2.  **AGI Server**: A server that listens for connections from Asterisk via the Asterisk Gateway Interface (AGI) protocol. It receives control of incoming calls and executes the configured IVR flows in real-time.

## Prerequisites

-   Node.js (v20.x or later)
-   NPM
-   A running PostgreSQL instance (see `../INSTALL.md`)
-   A running Asterisk instance (see `../INSTALL.md`)

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment:**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    Now, edit the `.env` file and fill in your PostgreSQL database credentials and the desired port for the AGI server.

## Running the Server

To start the AGI server, run:
```bash
npm start
```
The server will now listen for incoming AGI connections from Asterisk on the port specified in your `.env` file (default: 4573).

## How it Works

1.  The `server.js` file initializes and starts the AGI server using the `asterisk.io` library.
2.  When Asterisk receives a call, its `extensions.conf` is configured to hand control over to this AGI server.
3.  The `asterisk.io` server receives a `context` object for each call and passes it to our main script, `agi-handler.js`.
4.  The `agi-handler.js` uses the dialed number (DNID) from the context to query the PostgreSQL database (via `services/db.js`) for the corresponding IVR flow.
5.  If a flow is found, it is passed to the `services/ivr-executor.js`, which interprets the flow's nodes and connections, sending commands back to Asterisk (e.g., play a message, wait for input, transfer the call).
6.  The executor continues until the flow ends or the call is hung up.