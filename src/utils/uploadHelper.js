/**
 * Upload Helper Utilities
 * Provides file validation, FormData building, and upload functions
 * Handles 413 errors and provides user-friendly error messages
 */

// File validation with detailed error messages
import BASE_API_URL from './apiConfig';
export function validateFiles(imageFile, logoFile, maxSizeBytes = 10 * 1024 * 1024) {
  if (!imageFile) throw new Error('Image file is required.');
  if (!imageFile.type.startsWith('image/')) {
    throw new Error('Image must be an image file (jpg, png, gif, webp, etc.).');
  }
  if (imageFile.size > maxSizeBytes) {
    const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
    const currentMB = (imageFile.size / (1024 * 1024)).toFixed(2);
    throw new Error(`Image exceeds max size of ${maxMB}MB. Current: ${currentMB}MB.`);
  }

  if (logoFile) {
    if (!logoFile.type.startsWith('image/')) {
      throw new Error('Logo must be an image file (jpg, png, gif, webp, etc.).');
    }
    if (logoFile.size > maxSizeBytes) {
      const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
      const currentMB = (logoFile.size / (1024 * 1024)).toFixed(2);
      throw new Error(`Logo exceeds max size of ${maxMB}MB. Current: ${currentMB}MB.`);
    }
  }

  return true;
}

// Build FormData with correct field names for job creation
export function buildJobFormData(values, imageFile, logoFile) {
  const form = new FormData();

  // Text fields
  form.append('company', values.company || '');
  form.append('positionName', values.positionName || '');
  form.append('qualification', values.qualification || '');
  form.append('experience', values.experience || '');
  form.append('salary', values.salary || '');
  form.append('location', values.location || '');
  form.append('applylink', values.applylink || '');
  form.append('tags', values.tags || '');
  form.append('companyOverview', values.companyOverview || '');
  form.append('email', values.email || '');
  form.append('driveLocation', values.driveLocation || '');
  form.append('driveDate', values.driveDate || '');
  form.append('driveTime', values.driveTime || '');
  form.append('driveContactPerson', values.driveContactPerson || '');
  form.append('driveContactNumber', values.driveContactNumber || '');
  form.append('type', values.type || '');

  // Optional fields
  if (values.department) form.append('department', values.department);
  if (values.applicationDeadline) form.append('applicationDeadline', values.applicationDeadline);

  // Array fields: append each entry separately
  (values.responsibilities || []).forEach(r => form.append('responsibilities', r));
  (values.skills || []).forEach(s => form.append('skills', s));

  // File fields
  form.append('image', imageFile);
  if (logoFile) form.append('logo', logoFile);

  return form;
}

// Upload with fetch API
export async function uploadJobFetch(values, imageFile, logoFile, token, maxSizeBytes = 10 * 1024 * 1024) {
  // Validate files first
  validateFiles(imageFile, logoFile, maxSizeBytes);

  // Build FormData
  const form = buildJobFormData(values, imageFile, logoFile);

  // Log file sizes for debugging
  console.log('Uploading - image size:', imageFile.size, 'bytes', 'logo size:', logoFile?.size || 'none');

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_API_URL}/api/jobs`, {
    method: 'POST',
    headers,
    // DO NOT set Content-Type - browser will set it with boundary
    body: form
  });

  if (res.status === 413) {
    throw new Error('Server: Payload too large. Try compressing images or contact admin.');
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || json.message || `Upload failed (${res.status})`);
  }

  return await res.json();
}

// Upload with axios (if axios is available)
export async function uploadJobAxios(values, imageFile, logoFile, token, onProgress, maxSizeBytes = 10 * 1024 * 1024) {
  // This requires axios to be imported in the calling component
  // Returns a function that can be called with axios as argument
  return async (axios) => {
    validateFiles(imageFile, logoFile, maxSizeBytes);
    const form = buildJobFormData(values, imageFile, logoFile);

    console.log('Uploading with axios - image size:', imageFile.size, 'bytes');

    try {
      const res = await axios.post(`${BASE_API_URL}/api/jobs`, form, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
          // DO NOT set 'Content-Type'
        },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            const percent = Math.round((e.loaded * 100) / e.total);
            onProgress(percent);
          }
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 413) {
        throw new Error('Server returned 413: Payload too large. Compress images or contact admin.');
      }
      throw err;
    }
  };
}

// Validate single file (generic)
export function validateFile(file, fileType = 'image/*', maxSizeBytes = 10 * 1024 * 1024) {
  if (!file) return { isValid: false, error: 'File is required' };

  if (!file.type.match(fileType.replace('*', '.*'))) {
    return { isValid: false, error: `File must be of type ${fileType}` };
  }

  if (file.size > maxSizeBytes) {
    const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
    return { isValid: false, error: `File size must be less than ${maxMB}MB` };
  }

  return { isValid: true, error: null };
}

// Optional: Image compression helper (requires browser-image-compression package)
export async function compressImageIfNeeded(file, maxSizeMB = 2) {
  // Return original if small enough
  if (file.size / 1024 / 1024 <= maxSizeMB) return file;

  try {
    // Try to import and use browser-image-compression
    const imageCompression = require('browser-image-compression');
    const options = {
      maxSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };
    return await imageCompression(file, options);
  } catch (err) {
    console.warn('Image compression not available, using original file');
    return file;
  }
}

const uploadHelpers = {
  validateFiles,
  buildJobFormData,
  uploadJobFetch,
  uploadJobAxios,
  validateFile,
  compressImageIfNeeded
};

export default uploadHelpers;
