const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
let wss;

const clients = new Map(); // Map<ws, {id: string, role: string}>

/**
 * Initialise le serveur WebSocket et l'attache au serveur HTTP existant.
 * @param {http.Server} server - L'instance du serveur HTTP.
 * @returns {WebSocket.Server} L'instance du serveur WebSocket.
 */
function initializeWebSocketServer(server) {
    wss = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        const { query } = url.parse(request.url, true);
        const token = query.token;

        if (!token) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            // Si le token est valide, on "upgrade" la connexion en WebSocket
            wss.handleUpgrade(request, socket, head, (ws) => {
                ws.user = decoded; // Attache les infos user au client ws
                wss.emit('connection', ws, request);
            });
        });
    });

    wss.on('connection', (ws) => {
        console.log(`[WS] Client connected: User ID ${ws.user.id}, Role ${ws.user.role}`);
        clients.set(ws, { id: ws.user.id, role: ws.user.role });

        ws.on('close', () => {
            console.log(`[WS] Client disconnected: User ID ${ws.user.id}`);
            clients.delete(ws);
        });

        ws.on('error', (error) => {
            console.error('[WS] Error for client:', ws.user.id, error);
        });
    });
    
    console.log('[WS] WebSocket Server initialized.');
    return wss;
}

/**
 * Diffuse un événement à tous les clients connectés dans une "room" spécifique.
 * Les rooms sont basées sur le rôle de l'utilisateur.
 * @param {string} room - Le nom de la room (ex: 'superviseur', 'admin').
 * @param {object} event - L'objet événement à envoyer.
 */
function broadcastToRoom(room, event) {
    if (!wss) {
        console.error("[WS] WebSocket server is not initialized.");
        return;
    }

    const message = JSON.stringify(event);
    const targetRoles = new Set();
    if (room === 'superviseur') targetRoles.add('Superviseur').add('Administrateur').add('SuperAdmin');
    if (room === 'admin') targetRoles.add('Administrateur').add('SuperAdmin');
    
    clients.forEach((clientInfo, clientWs) => {
        if (targetRoles.has(clientInfo.role) && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(message);
        }
    });
}

module.exports = {
    initializeWebSocketServer,
    broadcastToRoom,
};
