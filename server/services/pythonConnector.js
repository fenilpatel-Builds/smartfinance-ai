import axios from 'axios';
import fs from 'fs';
import path from 'path';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
const SERVICE_SECRET = process.env.PYTHON_SERVICE_SECRET || 'smartfinance_internal_python_secret_2026';

export const checkPythonServiceHealth = async () => {
  try {
    const res = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout: 3000 });
    return { isOnline: true, data: res.data };
  } catch (err) {
    return { isOnline: false, error: err.message };
  }
};

export const requestPythonExtraction = async (absoluteFilePath, customMapping = null, jobId = null) => {
  const url = `${PYTHON_SERVICE_URL}/api/v1/process-statement`;
  
  try {
    const response = await axios.post(
      url,
      {
        filePath: absoluteFilePath,
        customMapping: customMapping || undefined,
        jobId: jobId || undefined,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-service-secret': SERVICE_SECRET,
        },
        timeout: 45000,
      }
    );
    return response.data;
  } catch (err) {
    console.error('[PythonConnector] Error calling Python service:', err.response?.data || err.message);
    throw new Error(
      err.response?.data?.detail ||
      err.message ||
      'Failed to communicate with Python document processing service'
    );
  }
};

