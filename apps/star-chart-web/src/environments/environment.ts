export const environment = {
  production: false,
  apiUrl: '/api',
  wsUrl: 'ws://localhost:3000',
  useMockWebSocket: true,  // Set to true to use mock mode for WebSockets
  webSocket: {
    reconnectionAttempts: 5,
    initialReconnectDelay: 5000,
    maxReconnectDelay: 60000,
    reconnectEnabled: true,
    autoConnect: true
  }
};
