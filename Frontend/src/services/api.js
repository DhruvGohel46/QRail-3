/**
 * Centralized API utility for QRail frontend
 * Handles all backend API communication with proper error handling
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

/**
 * Get auth token from local storage
 */
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Default fetch options with credentials
 */
const defaultOptions = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
  },
};

/**
 * Handle API response and errors
 */
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error occurred' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * API utility functions
 */
export const api = {
  /**
   * Authentication APIs
   */
  auth: {
    login: async (credentials) => {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      const data = await handleResponse(response);
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      return data;
    },

    logout: async () => {
      const response = await fetch(`${API_BASE_URL}/api/logout`, {
        ...defaultOptions,
        method: 'POST',
      });
      localStorage.removeItem('auth_token');
      return handleResponse(response);
    },

    checkSession: async () => {
      const response = await fetch(`${API_BASE_URL}/api/check-session`, {
        ...defaultOptions,
        method: 'GET',
      });
      return handleResponse(response);
    },

    register: async (userData) => {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    },
    sendOtp: async (email) => {
      const response = await fetch(`${API_BASE_URL}/api/send-otp`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return handleResponse(response);
    },

    verifyOtp: async (email, otp) => {
      const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      return handleResponse(response);
    },
  },

  /**
   * Asset APIs
   */
  assets: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/api/assets`, {
        ...defaultOptions,
        method: 'GET',
      });
      return handleResponse(response);
    },

    create: async (assetData) => {
      const response = await fetch(`${API_BASE_URL}/api/assets`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify(assetData),
      });
      return handleResponse(response);
    },

    update: async (assetId, assetData) => {
      const response = await fetch(`${API_BASE_URL}/api/assets/${assetId}`, {
        ...defaultOptions,
        method: 'PUT',
        body: JSON.stringify(assetData),
      });
      return handleResponse(response);
    },

    delete: async (assetId) => {
      const response = await fetch(`${API_BASE_URL}/api/assets/${assetId}`, {
        ...defaultOptions,
        method: 'DELETE',
      });
      return handleResponse(response);
    },
  },

  /**
   * QR Code APIs
   */
  qr: {
    scanFromText: async (qrData) => {
      const response = await fetch(`${API_BASE_URL}/api/scan-qr`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify({ qr_data: qrData }),
      });
      return handleResponse(response);
    },

    scanFromFile: async (file) => {
      const formData = new FormData();
      formData.append('qr_image', file);

      const response = await fetch(`${API_BASE_URL}/api/scan-qr-file`, {
        credentials: 'include',
        method: 'POST',
        body: formData,
      });
      return handleResponse(response);
    },

    scanFromFrame: async (imageData) => {
      // Remove data URL prefix if present
      const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
      const response = await fetch(`${API_BASE_URL}/api/scan-qr-frame`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify({
          image: base64Image,
          format: 'base64'
        }),
      });
      return handleResponse(response);
    },

    generate: async (assetId, options = {}) => {
      const response = await fetch(`${API_BASE_URL}/api/generate-qr`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify({
          asset_id: assetId,
          ...options,
        }),
      });
      return handleResponse(response);
    },
  },

  /**
   * Maintenance APIs
   */
  maintenance: {
    getAll: async (assetId = null) => {
      const url = assetId
        ? `${API_BASE_URL}/api/maintenance?asset_id=${assetId}`
        : `${API_BASE_URL}/api/maintenance`;
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'GET',
      });
      return handleResponse(response);
    },

    create: async (maintenanceData) => {
      const response = await fetch(`${API_BASE_URL}/api/maintenance`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify(maintenanceData),
      });
      return handleResponse(response);
    },
  },

  /**
   * Reports APIs
   */
  reports: {
    getStats: async () => {
      const response = await fetch(`${API_BASE_URL}/api/reports/stats`, {
        ...defaultOptions,
        method: 'GET',
      });
      return handleResponse(response);
    },

    export: async (format = 'csv') => {
      const response = await fetch(`${API_BASE_URL}/api/reports/export?format=${format}`, {
        ...defaultOptions,
        method: 'GET',
      });
      return response.blob();
    },
  },

  /**
 * Admin APIs
 */
  admin: {
    // Get all users (active and pending)
    getAllUsers: async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        ...defaultOptions,
        method: 'GET',
      });
      return handleResponse(response);
    },

    // Get pending users only (backward compatibility)
    getPendingUsers: async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/pending-users`, {
        ...defaultOptions,
        method: 'GET',
      });
      return handleResponse(response);
    },

    // Approve pending user
    approveUser: async (username) => {
      const response = await fetch(`${API_BASE_URL}/api/admin/approve-user`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      return handleResponse(response);
    },

    // Reject pending user
    rejectUser: async (username) => {
      const response = await fetch(`${API_BASE_URL}/api/admin/reject-user`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      return handleResponse(response);
    },

    // Delete active user
    deleteUser: async (username) => {
      const response = await fetch(`${API_BASE_URL}/api/admin/delete-user`, {
        ...defaultOptions,
        method: 'DELETE',
        body: JSON.stringify({ username }),
      });
      return handleResponse(response);
    },

    // Create new admin user
    createAdmin: async (userData) => {
      const response = await fetch(`${API_BASE_URL}/api/admin/create-admin`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    },
  },
    /**
   * AI Enhancement APIs
   */
  ai: {
    enhanceDescription: async (description) => {
      const response = await fetch(`${API_BASE_URL}/api/ai/enhance-description`, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify({ description }),
      });
      return handleResponse(response);
    },
  },

};

export default api;

