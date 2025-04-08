/**
 * Base interface for all metrics-related payloads
 */
export interface BaseMetricsPayload {
  action: string;
  requestId?: string;
}

/**
 * Registration request for a metrics stream
 */
export interface RegistrationPayload extends BaseMetricsPayload {
  stream: string;
  options?: {
    interval?: string;
    details?: string[];
    requestId?: string;
  };
}

/**
 * Ping request to check gateway connectivity
 */
export interface PingPayload extends BaseMetricsPayload {
  options?: {
    requestId?: string;
    [key: string]: unknown;
  };
}

/**
 * Generic message with data payload
 */
export interface MetricsMessage extends BaseMetricsPayload {
  channel?: string;
  stream?: string;
  data?: unknown;
  options?: {
    requestId?: string;
    delayMs?: number;
    [key: string]: unknown;
  };
  _forceError?: boolean;
  target?: string;
}

/**
 * Base response interface
 */
export interface BaseMetricsResponse extends BaseMetricsPayload {
  timestamp?: string;
}

/**
 * Success response with data
 */
export interface MetricsSuccessResponse extends BaseMetricsResponse {
  data: unknown;
  success?: boolean;
  message?: string;
}

/**
 * Error response
 */
export interface MetricsErrorResponse extends BaseMetricsResponse {
  error: string;
  success: false;
  data?: unknown;
}

/**
 * Registration acknowledgment response
 */
export interface RegistrationAckResponse extends BaseMetricsResponse {
  success: boolean;
  stream: string;
  message: string;
}

/**
 * Pong response to ping request
 */
export interface PongResponse extends BaseMetricsResponse {
  action: 'pong';
  serverTime: string;
}

/**
 * Metrics stream data for specific types
 */
export interface MetricsStreamData<T = unknown> {
  stream: string;
  data: T;
  timestamp: string;
  isMock?: boolean;
}

/**
 * Health metrics structure
 */
export interface HealthMetrics {
  servers: {
    name: string;
    status: string;
    uptime: string;
    load: number;
  }[];
  databases: {
    name: string;
    status: string;
    connections: number;
    latency: string;
  }[];
  services: {
    name: string;
    status: string;
    requests: number;
    errorRate: number;
  }[];
  isMock?: boolean;
}

/**
 * Performance metrics structure
 */
export interface PerformanceMetrics {
  metrics: {
    id: string;
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    source?: string;
    type?: string;
  }[];
  isMock?: boolean;
}
