// --- GLOBAL ERROR HANDLERS ---
// These are crucial for debugging silent crashes.
process.on('uncaughtException', (error) => {
  console.error('FATAL: Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});


// --- DEPENDENCIES ---
// Load environment variables from .env file BEFORE any other code runs.
require('dotenv').config();

const express = require('express');
const http = require('http');
const net = require('net');
const cors = require('cors');
const Agi = require('asteriskagi');
const agiHandler = require('./agi-handler.js');
const db = require('./services/db');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cookieParser = require('cookie-parser');
const { initializeWebSocketServer } = require('./services/webSocketServer.js');
const { initializeAmiListener } = require('./services/amiListener.js');
const os = require('os');
const fs = require('fs/promises');
const authMiddleware = require('./middleware/auth.middleware.js');


// --- INITIALIZATION ---
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.static(path.join(__dirname, '..', 'dist')));

// --- SWAGGER CONFIGURATION ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'EVSCallPro API',
            version: '1.0.0',
            description: 'API pour la solution de centre de contact EVSCallPro.',
        },
        servers: [{ url: `/api` }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }, loginId: { type: 'string' }, firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string', nullable: true }, role: { type: 'string' }, isActive: { type: 'boolean' }, siteId: { type: 'string', nullable: true }, mobileNumber: { type: 'string', nullable: true }, useMobileAsStation: { type: 'boolean' }
                    }
                },
                UserGroup: {
                    type: 'object',
                    properties: { id: { type: 'string' }, name: { type: 'string' }, memberIds: { type: 'array', items: { type: 'string' } } }
                },
                Campaign: {
                    type: 'object',
                    properties: { id: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, scriptId: { type: 'string', nullable: true }, callerId: { type: 'string' }, isActive: { type: 'boolean' }, dialingMode: { type: 'string' }, wrapUpTime: { type: 'integer' } }
                },
                Contact: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }, firstName: { type: 'string' }, lastName: { type: 'string' }, phoneNumber: { type: 'string' }, postalCode: { type: 'string' }, customFields: { type: 'object' }
                    }
                },
                Script: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, pages: { type: 'array', items: { type: 'object' } } } },
                Qualification: { type: 'object', properties: { id: { type: 'string' }, code: { type: 'string' }, description: { type: 'string' }, type: { type: 'string' }, groupId: { type: 'string', nullable: true }, parentId: { type: 'string', nullable: true } } },
                QualificationGroup: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
                IvrFlow: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, nodes: { type: 'array', items: { type: 'object' } }, connections: { type: 'array', items: { type: 'object' } } } },
                Trunk: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, domain: { type: 'string' }, authType: { type: 'string' } } },
                Did: { type: 'object', properties: { id: { type: 'string' }, number: { type: 'string' }, description: { type: 'string' }, trunkId: { type: 'string' }, ivrFlowId: { type: 'string', nullable: true } } },
                Site: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
                PlanningEvent: { type: 'object', properties: { id: { type: 'string' }, agentId: { type: 'string' }, activityId: { type: 'string' }, startDate: { type: 'string', format: 'date-time' }, endDate: { type: 'string', format: 'date-time' } } },
                ContactNote: { type: 'object', properties: { id: { type: 'string' }, contactId: { type: 'string' }, agentId: { type: 'string' }, campaignId: { type: 'string' }, note: { type: 'string' } } },
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: [
        './routes/*.js',
        './server.js'
    ],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// --- API ROUTES ---
// Public route
app.use('/api/auth', require(path.join(__dirname, 'routes', 'auth.js')));

// Protected routes
app.use(authMiddleware); // All routes below this are now protected

app.use('/api/call', require(path.join(__dirname, 'routes', 'call.js')));
app.use('/api/users', require(path.join(__dirname, 'routes', 'users.js')));
app.use('/api/user-groups', require(path.join(__dirname, 'routes', 'groups.js')));
app.use('/api/campaigns', require(path.join(__dirname, 'routes', 'campaigns.js')));
app.use('/api/scripts', require(path.join(__dirname, 'routes', 'scripts.js')));
app.use('/api/qualifications', require(path.join(__dirname, 'routes', 'qualifications.js')));
app.use('/api/qualification-groups', require(path.join(__dirname, 'routes', 'qualifications.js')));
app.use('/api/ivr-flows', require(path.join(__dirname, 'routes', 'ivr.js')));
app.use('/api/trunks', require(path.join(__dirname, 'routes', 'telephony.js')));
app.use('/api/dids', require(path.join(__dirname, 'routes', 'telephony.js')));
app.use('/api/sites', require(path.join(__dirname, 'routes', 'sites.js')));
app.use('/api/planning-events', require(path.join(__dirname, 'routes', 'planning.js')));
app.use('/api/contacts', require(path.join(__dirname, 'routes', 'contacts.js')));
// Add new routes
app.use('/api/system', require(path.join(__dirname, 'routes', 'system.js')));
app.use('/api/audio-files', require(path.join(__dirname, 'routes', 'audio.js')));


// --- SPECIAL SYSTEM ROUTES ---
/**
 * @openapi
 * /application-data:
 *   get:
 *     summary: Récupère toutes les données nécessaires au démarrage de l'application.
 *     tags: [Application]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Un objet contenant toutes les collections de données.
 */
app.get('/api/application-data', async (req, res) => {
    try {
        const [
            users, userGroups, savedScripts, campaigns, qualifications,
            qualificationGroups, ivrFlows, audioFiles, trunks, dids, sites,
            planningEvents, activityTypes, personalCallbacks, callHistory, agentSessions,
            contactNotes
        ] = await Promise.all([
            db.getUsers(), db.getUserGroups(), db.getScripts(), db.getCampaigns(),
            db.getQualifications(), db.getQualificationGroups(), db.getIvrFlows(),
            db.getAudioFiles(), db.getTrunks(), db.getDids(), db.getSites(),
            db.getPlanningEvents(), db.getActivityTypes(), db.getPersonalCallbacks(),
            db.getCallHistory(), db.getAgentSessions(), db.getContactNotes()
        ]);
        
        const systemConnectionSettings = {
            database: {
                host: process.env.DB_HOST || '',
                port: parseInt(process.env.DB_PORT || '5432'),
                user: process.env.DB_USER || '',
                database: process.env.DB_NAME || '',
            },
            asterisk: {
                amiHost: process.env.AMI_HOST || '',
                amiPort: parseInt(process.env.AMI_PORT || '5038'),
                amiUser: process.env.AMI_USER || '',
                agiPort: parseInt(process.env.AGI_PORT || '4573'),
            }
        };

        res.json({
            users, userGroups, savedScripts, campaigns, qualifications,
            qualificationGroups, ivrFlows, audioFiles, trunks, dids, sites,
            planningEvents, activityTypes, personalCallbacks, callHistory, agentSessions,
            contactNotes,
            systemConnectionSettings,
            moduleVisibility: { categories: {}, features: {} },
            backupLogs: [],
            backupSchedule: { frequency: 'daily', time: '02:00' },
            systemLogs: [],
            versionInfo: { application: '1.0.0', asterisk: '18.x', database: '14.x', 'asteriskagi': '1.2.2' },
            connectivityServices: [
                { id: 'db', name: 'Base de Données', target: `${process.env.DB_HOST}:${process.env.DB_PORT}` },
                { id: 'ami', name: 'Asterisk AMI', target: `${process.env.AMI_HOST}:${process.env.AMI_PORT}` },
            ],
        });
    } catch (error) {
        console.error("Error fetching application data:", error);
        res.status(500).json({ error: "Failed to load application data." });
    }
});

app.post('/api/system-connection', async (req, res) => {
    try {
        const settings = req.body;
        // This is simplified. A real app would write to a secure config store.
        let envContent = await fs.readFile('.env', 'utf-8');
        const updates = {
            DB_HOST: settings.database.host,
            DB_PORT: settings.database.port,
            DB_USER: settings.database.user,
            DB_NAME: settings.database.database,
            ...(settings.database.password && { DB_PASSWORD: settings.database.password }),
            AMI_HOST: settings.asterisk.amiHost,
            AMI_PORT: settings.asterisk.amiPort,
            AMI_USER: settings.asterisk.amiUser,
            ...(settings.asterisk.amiPassword && { AMI_SECRET: settings.asterisk.amiPassword }),
            AGI_PORT: settings.asterisk.agiPort,
        };
        for(const [key, value] of Object.entries(updates)) {
            const regex = new RegExp(`^${key}=.*`, 'm');
            if (envContent.match(regex)) {
                envContent = envContent.replace(regex, `${key}=${value}`);
            } else {
                envContent += `\n${key}=${value}`;
            }
        }
        await fs.writeFile('.env', envContent);
        res.json({ message: 'Settings saved. Restart the application to apply changes.' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save settings." });
    }
});

// AGI SERVER
const agiPort = parseInt(process.env.AGI_PORT || '4573', 10);
const agiNetServer = net.createServer((socket) => {
    console.log('[AGI] New AGI connection received.');
    const agiContext = new Agi(agiHandler, socket);
    agiContext.on('error', (err) => console.error('[AGI] Error on AGI context:', err));
    agiContext.on('close', () => console.log('[AGI] AGI context closed.'));
}).on('error', (err) => {
    console.error(`[AGI] Critical error on AGI server, port ${agiPort}:`, err);
    throw err;
});
agiNetServer.listen(agiPort, () => {
    console.log(`[AGI] Server listening for connections from Asterisk on port ${agiPort}`);
});

// --- WEBSOCKET & AMI ---
initializeWebSocketServer(server);
initializeAmiListener();

// --- SERVE FRONTEND ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// --- START SERVER ---
server.listen(PORT, () => {
    console.log(`HTTP server listening on port ${PORT}`);
});