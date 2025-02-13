const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (file) => {
    // Validate input
    if (!file || !file.buffer) {
        console.error('Invalid file object received:', file);
        throw new Error('Invalid file object: No buffer found');
    }

    try {
        console.log('Starting Cloudinary upload process...');
        
        // Convert buffer to base64
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        
        console.log('Uploading to Cloudinary with options:', {
            folder: 'event-management',
            resource_type: 'auto',
            timeout: 60000
        });

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'event-management',
            resource_type: 'auto',
            timeout: 60000, // 60 seconds timeout
        });

        if (!result || !result.secure_url) {
            console.error('Invalid Cloudinary response:', result);
            throw new Error('Invalid response from Cloudinary: No secure URL received');
        }

        console.log('Cloudinary upload successful:', {
            public_id: result.public_id,
            url: result.secure_url
        });
        
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            config: {
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
                api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
                api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
            }
        });
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};

module.exports = { uploadToCloudinary }; 