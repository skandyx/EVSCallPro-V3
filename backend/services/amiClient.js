const AsteriskManager = require('asterisk-manager');

let ami = null;
let isConnecting = false;
const RECONNECT_DELAY = 5000; // 5 secondes

const amiConfig = {
    port: process.env.AMI_PORT,
    host: process.env.AMI_HOST,
    username: process.env.AMI_USER,
    password: process.env.AMI_SECRET,
    reconnect: false // Nous gérons la reconnexion manuellement
};

/**
 * Crée et retourne une singleton instance of the Asterisk Manager client.
 */
const getAmiClient = () => {
    if (!ami) {
        console.log('[AMI Client] Initializing AMI client...');
        ami = new AsteriskManager(
            amiConfig.port,
            amiConfig.host,
            amiConfig.username,
            amiConfig.password,
            true // Events on
        );

        ami.on('error', (err) => {
            console.error('[AMI Client] AMI Error:', err);
            // L'erreur de connexion est gérée par le 'disconnect' ou 'internalError'
        });
        
        ami.on('internalError', (error) => {
            console.error('[AMI Client] Internal Error, will attempt to reconnect:', error);
            ami.disconnect(); // Assure une déconnexion propre avant la tentative de reconnexion
        });

    }
    return ami;
};

const connectWithRetry = () => {
    const client = getAmiClient();

    if (client.isConnected() || isConnecting) {
        return;
    }

    isConnecting = true;
    console.log('[AMI Client] Attempting to connect...');

    // Handlers de déconnexion et de reconnexion
    const handleDisconnect = () => {
        isConnecting = false;
        console.warn('[AMI Client] Disconnected. Scheduling reconnect.');
        
        // Supprime les anciens listeners pour éviter les doublons
        client.removeListener('connect', handleConnect);
        client.removeListener('disconnect', handleDisconnect);

        setTimeout(connectWithRetry, RECONNECT_DELAY);
    };

    const handleConnect = () => {
        isConnecting = false;
        console.log('[AMI Client] Connected successfully.');
        
        // Une fois connecté, on écoute pour une future déconnexion
        client.once('disconnect', handleDisconnect);
    };

    client.once('connect', handleConnect);
    
    // Lance la connexion
    // FIX: The .connect() method of this library does not take a callback.
    // The configuration is passed in the constructor. Calling it with a function
    // as an argument caused a TypeError [ERR_INVALID_ARG_TYPE].
    // The call should be parameter-less.
    client.connect();
};


// Exporte le client singleton pour un accès direct, et la fonction de connexion pour l'initialisation
module.exports = {
    amiClient: getAmiClient(),
    connectWithRetry
};