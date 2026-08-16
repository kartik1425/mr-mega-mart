/* MR Mega Mart Admin Direct Cloudinary Image Uploader */

class CloudinaryUploader {
  static async uploadFile(file, options = {}) {
    const {
      folder = 'mrmegamart/products',
      onProgress = null,
    } = options;

    if (!file) {
      throw new Error('No file provided for upload.');
    }

    // 1. Obtain temporary signed parameters from MR Mega Mart Backend
    let signData;
    try {
      signData = await AdminApiClient.post('/api/admin/media/sign', { folder });
    } catch (err) {
      throw new Error(`Failed to initialize upload signature: ${err.message}`);
    }

    if (!signData || !signData.signature || !signData.cloudName || !signData.apiKey) {
      throw new Error(signData.message || 'Cloudinary credentials are not configured on the server.');
    }

    const { signature, timestamp, apiKey, cloudName } = signData;

    // 2. Build FormData for direct browser-to-Cloudinary upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    // 3. Upload directly to Cloudinary REST endpoint
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl, true);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              url: response.secure_url || response.url,
              publicId: response.public_id,
              width: response.width,
              height: response.height,
              format: response.format,
            });
          } catch (e) {
            reject(new Error('Invalid response from Cloudinary.'));
          }
        } else {
          try {
            const errResponse = JSON.parse(xhr.responseText);
            reject(new Error(errResponse.error?.message || `Cloudinary upload failed (HTTP ${xhr.status})`));
          } catch (_) {
            reject(new Error(`Cloudinary upload failed (HTTP ${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network connection error while uploading image to Cloudinary.'));
      };

      xhr.send(formData);
    });
  }
}

window.CloudinaryUploader = CloudinaryUploader;
