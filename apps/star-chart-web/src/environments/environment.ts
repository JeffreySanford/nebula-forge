export const environment = {
  production: false,
  wsUrl: 'ws://localhost:3000/socket',  // Updated path to match backend namespace
  apiUrl: 'http://localhost:3000/api',
  useMockWebSocket: true, // Set default to use mock data until connection is established
  webSocket: {
    reconnectionAttempts: 5,
    initialReconnectDelay: 3000,
    maxReconnectDelay: 30000,
    connectionTimeout: 10000, // 10 seconds timeout before falling back to mock
    reconnectEnabled: true,
    autoConnect: true
  },
  logging: {
    level: 'debug',
    displayInConsole: true
  }
};
