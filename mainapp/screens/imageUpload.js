import { cloudinaryConfig } from '../utils/cloudinaryConfig';

export const uploadImage = async (imageUri) => {
  const data = new FormData();
  data.append('file', {
    uri: imageUri,
    type: 'image/jpeg', // or the appropriate mime type
    name: 'image.jpg', // or the appropriate file name
  });
  data.append('upload_preset', 'YOUR_UPLOAD_PRESET'); // Replace with your upload preset

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
      method: 'POST',
      body: data,
    });
    const result = await response.json();
    return result.secure_url; // This is the URL of the uploaded image
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
