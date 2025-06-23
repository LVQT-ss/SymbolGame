import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocketConfig } from '../config/socketConfig';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.battleEventListeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    async connect() {
        try {
            if (this.socket && this.isConnected) {
                console.log('🔗 Socket already connected');
                return;
            }

            // Disconnect existing socket if any
            if (this.socket) {
                console.log('🔄 Disconnecting existing socket before reconnecting');
                this.socket.disconnect();
                this.socket = null;
                this.isConnected = false;
            }

            // Get auth token
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.error('❌ No auth token found, cannot connect to socket');
                return;
            }

            const socketConfig = getSocketConfig();
            console.log('🚀 Connecting to Socket.IO server:', socketConfig.url);

            // Create socket connection
            this.socket = io(socketConfig.url, {
                auth: {
                    token: token
                },
                autoConnect: true,
                forceNew: true, // Force new connection to prevent duplicate connections
                ...socketConfig.options
            });

            // Connection event handlers
            this.socket.on('connect', () => {
                console.log('✅ Connected to Socket.IO server');
                this.isConnected = true;
                this.reconnectAttempts = 0;
            });

            this.socket.on('disconnect', (reason) => {
                console.log('❌ Disconnected from Socket.IO server:', reason);
                this.isConnected = false;

                // Auto-reconnect for certain disconnect reasons
                if (reason === 'io server disconnect') {
                    // Server initiated disconnect, don't reconnect
                    return;
                }

                this.attemptReconnect();
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ Socket connection error:', error);
                console.error('❌ Connection details:', {
                    message: error.message,
                    type: error.type,
                    description: error.description
                });
                this.isConnected = false;
                this.attemptReconnect();
            });

            this.socket.on('reconnect', (attemptNumber) => {
                console.log('🔄 Reconnected successfully after', attemptNumber, 'attempts');
                this.isConnected = true;
                this.reconnectAttempts = 0;
            });

            this.socket.on('reconnect_error', (error) => {
                console.error('❌ Reconnection error:', error);
            });

            this.socket.on('reconnect_failed', () => {
                console.error('❌ Failed to reconnect after maximum attempts');
                this.isConnected = false;
            });

            // Battle-specific event handlers
            this.setupBattleEventHandlers();

        } catch (error) {
            console.error('❌ Failed to connect to socket:', error);
        }
    }

    async attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ Max reconnection attempts reached - Socket.IO unavailable');
            console.log('🔄 Falling back to polling mode for battle updates');
            this.isConnected = false;
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

        setTimeout(async () => {
            await this.connect();
        }, delay);
    }

    setupBattleEventHandlers() {
        if (!this.socket) return;

        // Opponent joined battle
        this.socket.on('opponent-joined', (data) => {
            console.log('👥 Opponent joined battle:', data);
            this.emitToListeners('opponent-joined', data);
        });

        // Round submitted by any player
        this.socket.on('round-submitted', (data) => {
            console.log('🎯 Round submitted:', data);
            this.emitToListeners('round-submitted', data);
        });

        // Round completed (both players answered)
        this.socket.on('round-completed', (data) => {
            console.log('✅ Round completed:', data);
            this.emitToListeners('round-completed', data);
        });

        // Player completed all rounds
        this.socket.on('player-completed', (data) => {
            console.log('🏁 Player completed battle:', data);
            this.emitToListeners('player-completed', data);
        });

        // Battle fully completed
        this.socket.on('battle-completed', (data) => {
            console.log('🎉 Battle completed:', data);
            this.emitToListeners('battle-completed', data);
        });

        // Player left battle
        this.socket.on('player-left', (data) => {
            console.log('🚪 Player left battle:', data);
            this.emitToListeners('player-left', data);
        });

        // Creator started battle (for start button functionality)
        this.socket.on('creator-started-battle', (data) => {
            this.emitToListeners('creator-started-battle', data);
        });

        // Countdown start (for synchronized countdown)
        this.socket.on('countdown-start', (data) => {
            console.log('⏰ Countdown started:', data);
            this.emitToListeners('countdown-start', data);
        });

        // Countdown updates (for synchronized countdown)
        this.socket.on('countdown-update', (data) => {
            console.log('⏰ Countdown update:', data);
            this.emitToListeners('countdown-update', data);
        });

        // Countdown finished (battle starts)
        this.socket.on('countdown-finished', (data) => {
            console.log('⏰ Countdown finished:', data);
            this.emitToListeners('countdown-finished', data);
        });

        // Round result (immediate feedback)
        this.socket.on('round-result', (data) => {
            console.log('🎯 Round result:', data);
            this.emitToListeners('round-result', data);
        });

        // Error handling
        this.socket.on('error', (data) => {
            console.error('❌ Socket error:', data);
            this.emitToListeners('error', data);
        });
    }

    // Join a specific battle room
    joinBattle(battleId) {
        if (!this.socket || !this.isConnected) {
            console.error('❌ Cannot join battle: Socket not connected');
            return;
        }

        console.log(`⚔️ Joining battle room: ${battleId}`);
        this.socket.emit('join-battle', { battleId });
    }

    // Leave a battle room
    leaveBattle(battleId) {
        if (!this.socket || !this.isConnected) {
            return;
        }

        console.log(`🚪 Leaving battle room: ${battleId}`);
        this.socket.emit('leave-battle', { battleId });
    }

    // Submit round answer
    submitRound(battleId, roundNumber, userSymbol, responseTime) {
        if (!this.socket || !this.isConnected) {
            console.error('❌ Cannot submit round: Socket not connected');
            return;
        }

        console.log(`🎯 Submitting round: Battle ${battleId}, Round ${roundNumber}, Answer: ${userSymbol}`);
        this.socket.emit('submit-round', {
            battleId,
            roundNumber,
            userSymbol,
            responseTime
        });
    }

    // Complete battle
    completeBattle(battleId) {
        if (!this.socket || !this.isConnected) {
            console.error('❌ Cannot complete battle: Socket not connected');
            return;
        }

        console.log(`🏁 Completing battle: ${battleId}`);
        this.socket.emit('complete-battle', { battleId });
    }

    // Event listener management
    addEventListener(event, callback) {
        if (!this.battleEventListeners.has(event)) {
            this.battleEventListeners.set(event, new Set());
        }
        this.battleEventListeners.get(event).add(callback);

        console.log(`📢 Added listener for event: ${event}`);
    }

    removeEventListener(event, callback) {
        if (this.battleEventListeners.has(event)) {
            this.battleEventListeners.get(event).delete(callback);

            // Clean up empty event sets
            if (this.battleEventListeners.get(event).size === 0) {
                this.battleEventListeners.delete(event);
            }
        }

        console.log(`🗑️ Removed listener for event: ${event}`);
    }

    removeAllEventListeners(event = null) {
        if (event) {
            this.battleEventListeners.delete(event);
            console.log(`🗑️ Removed all listeners for event: ${event}`);
        } else {
            this.battleEventListeners.clear();
            console.log('🗑️ Removed all event listeners');
        }
    }

    emitToListeners(event, data) {
        if (this.battleEventListeners.has(event)) {
            const listeners = this.battleEventListeners.get(event);
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    // Disconnect socket
    disconnect() {
        if (this.socket) {
            console.log('🔌 Disconnecting from Socket.IO server');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.battleEventListeners.clear();
        }
    }

    // Connection status
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            socketId: this.socket?.id || null,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    // Check if connected
    isSocketConnected() {
        return this.isConnected && this.socket && this.socket.connected;
    }

    // Test connection
    testConnection() {
        console.log('🧪 Testing Socket.IO connection...');
        console.log('- Socket exists:', !!this.socket);
        console.log('- Is connected flag:', this.isConnected);
        console.log('- Socket connected:', this.socket?.connected);
        console.log('- Socket ID:', this.socket?.id);
        console.log('- Reconnect attempts:', this.reconnectAttempts);

        if (this.socket) {
            console.log('- Socket transport:', this.socket.io?.engine?.transport?.name);
            console.log('- Socket readyState:', this.socket.io?.engine?.readyState);
        }

        if (!this.isConnected) {
            console.log('❌ Socket not connected, falling back to polling');
        }
    }

    // Force reconnect with clean slate
    async forceReconnect() {
        console.log('🔄 Force reconnecting Socket.IO...');
        this.disconnect();
        this.reconnectAttempts = 0;
        await this.connect();
    }
}

// Export singleton instance
export default new SocketService(); 