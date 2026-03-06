// Your cloud name can be found in your dashboard
const CLOUD_NAME = "diqqsuiv5";
// The upload preset you just created
const UPLOAD_PRESET = "thapastore";

// Construct the Cloudinary URL
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

export const uploadToCloudinary = async (uri) => {
  try {
    const formData = new FormData();
    
    // Get the file extension
    const extension = uri.split('.').pop();
    const type = `image/${extension}`;

    formData.append('file', {
      uri,
      type,
      name: `upload.${extension}`,
    });
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    if (!data.secure_url) {
      throw new Error('Upload failed');
    }
    return data.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload image');
  }
}; 