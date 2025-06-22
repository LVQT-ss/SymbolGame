// Socket.IO Configuration
const SOCKET_CONFIG = {
    // Use production server (same as your API)
    production: {
        url: 'https://symbolgame.onrender.com',
        options: {
            transports: ['polling', 'websocket'],
            upgrade: true,
            timeout: 20000,
            forceNew: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10
        }
    },

    // Local development server
    local: {
        url: 'http://10.0.2.2:3000', // Android emulator
        // url: 'http://localhost:3000', // iOS simulator
        options: {
            transports: ['polling', 'websocket'],
            upgrade: true,
            timeout: 10000,
            forceNew: true,
            reconnection: true,
            reconnectionDelay: 500,
            reconnectionAttempts: 5
        }
    }
};

// Choose environment (change this to 'local' for local development)
const ENVIRONMENT = 'production';

export const getSocketConfig = () => {
    const config = SOCKET_CONFIG[ENVIRONMENT];
    console.log(`🔧 Using ${ENVIRONMENT} Socket.IO config:`, config.url);
    return config;
};

export default SOCKET_CONFIG; 