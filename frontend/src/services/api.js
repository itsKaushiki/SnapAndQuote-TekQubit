import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 120000, // increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});


// Request interceptor for logging (optional)
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Upload car image only
 * @param {FormData} formData - FormData containing image, name, model, year
 * @returns {Promise<Object>} Response data with filename and car info
 */
export const uploadCarImage = async (formData) => {
  try {
    // Validate FormData contains required fields
    if (!formData.has('image')) {
      throw new Error('Image file is required');
    }
    if (!formData.has('name') || !formData.has('model') || !formData.has('year')) {
      throw new Error('Car name, model, and year are required');
    }

    const response = await apiClient.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('🔥 Upload Error:', error);
    
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      throw new Error(data?.message || `Upload failed with status ${status}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'Upload failed');
    }
  }
};

/**
 * Detect damage in uploaded image
 * @param {string} filename - Name of the uploaded file
 * @returns {Promise<Object>} Response data with: parts[], detections[], confidence_used
 */
export const detectDamage = async (filename) => {
  try {
    if (!filename) {
      throw new Error('Filename is required');
    }

    const response = await apiClient.post('/api/detect', {
      filename: filename
    });

  return response.data; // { parts, detections, confidence_used }
  } catch (error) {
    console.error('🔥 Detection Error:', error);
    
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      throw new Error(data?.message || `Damage detection failed with status ${status}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'Damage detection failed');
    }
  }
};

/**
 * Get cost estimate for detected parts
 * @param {Object} data - Object containing carName, carModel, carYear, detectedParts
 * @param {string} data.carName - Name of the car
 * @param {string} data.carModel - Model of the car
 * @param {string} data.carYear - Year of the car
 * @param {string[]} data.detectedParts - Array of detected part names
 * @returns {Promise<Object>} Response data with cost breakdown and PDF report link
 */
export const estimateCost = async (data) => {
  try {
    // Validate required fields
    const { carName, carModel, carYear, detectedParts } = data;
    
    if (!carName || !carModel || !carYear) {
      throw new Error('Car name, model, and year are required');
    }
    
    if (!detectedParts || !Array.isArray(detectedParts) || detectedParts.length === 0) {
      throw new Error('Detected parts array is required and cannot be empty');
    }

    const response = await apiClient.post('/api/estimate', {
      carName,
      carModel,
      carYear,
      detectedParts,
    });
    return response.data; // { provider, attempts, costBreakdown, totalCost }
  } catch (error) {
    console.error('🔥 Estimate Error:', error);
    
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      throw new Error(data?.message || `Cost estimation failed with status ${status}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'Cost estimation failed');
    }
  }
};

// Helper function to create FormData for car image upload
export const createCarImageFormData = (imageFile, carInfo) => {
  const formData = new FormData();
  
  formData.append('image', imageFile);
  formData.append('name', carInfo.name);
  formData.append('model', carInfo.model);
  formData.append('year', carInfo.year);
  
  return formData;
};

/**
 * Send a message to the chatbot
 * @param {string} question - The user's question
 * @param {Object} context - Optional context (carInfo, detectedParts, etc.)
 * @returns {Promise<Object>} Response data with answer and sources
 */
export const sendChatMessage = async (question, context = null) => {
  try {
    const response = await apiClient.post('/api/chat', {
      question,
      context
    });
    return response.data;
  } catch (error) {
    console.error('Chat API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to send chat message');
  }
};

/**
 * Get report history
 * @returns {Promise<Object>} Response data with reports array and total count
 */
export const getReportHistory = async () => {
  try {
    const response = await apiClient.get('/api/history');
    return response.data;
  } catch (error) {
    console.error('History API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch report history');
  }
};

/**
 * Download a report by ID
 * @param {string} reportId - The report ID to download
 * @returns {Promise<void>} Initiates download
 */
export const downloadReport = async (reportId) => {
  try {
    const response = await apiClient.get(`/api/history/download/${reportId}`, {
      responseType: 'blob'
    });
    
    // Create blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AutoFix-AI-Report-${reportId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to download report');
  }
};

/**
 * Delete a report from history
 * @param {string} reportId - The report ID to delete
 * @returns {Promise<Object>} Response data
 */
export const deleteReport = async (reportId) => {
  try {
    const response = await apiClient.delete(`/api/history/${reportId}`);
    return response.data;
  } catch (error) {
    console.error('Delete report API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete report');
  }
};

/**
 * Upload audio file
 * @param {File} audioFile - Audio file to upload
 * @returns {Promise<Object>} Response data with filename
 */
export const uploadAudio = async (audioFile) => {
  try {
    if (!audioFile) {
      throw new Error('Audio file is required');
    }

    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await apiClient.post('/api/upload/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('🔥 Audio Upload Error:', error);
    
    if (error.response) {
      const { status, data } = error.response;
      throw new Error(data?.message || `Audio upload failed with status ${status}`);
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error(error.message || 'Audio upload failed');
    }
  }
};

/**
 * Analyze audio for anomalies
 * @param {string} filename - Name of the uploaded audio file
 * @returns {Promise<Object>} Response data with classification, score, confidence
 */
export const analyzeAudio = async (filename) => {
  try {
    if (!filename) {
      throw new Error('Filename is required');
    }

    const response = await apiClient.post('/api/audio', {
      filename: filename
    });

    return response.data; // { classification, score, confidence, probability_normal, probability_anomalous, isAnomalous }
  } catch (error) {
    console.error('🔥 Audio Analysis Error:', error);
    
    if (error.response) {
      const { status, data } = error.response;
      throw new Error(data?.message || `Audio analysis failed with status ${status}`);
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error(error.message || 'Audio analysis failed');
    }
  }
};

// Export the configured axios instance for direct use if needed
export { apiClient };

export default {
  uploadCarImage,
  estimateCost,
  createCarImageFormData,
  sendChatMessage,
  getReportHistory,
  downloadReport,
  deleteReport,
};
