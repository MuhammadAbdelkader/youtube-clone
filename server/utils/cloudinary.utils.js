const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudUploader {
    constructor() {}

    async uploadToCloudinary(fileBuffer) {
        return new Promise((resolve, reject) => {
            const upload_stream = cloudinary.uploader.upload_stream(
                { 
                    resource_type: "auto",
                    folder: "youtube_clone",
                    transformation: [
                        { quality: "auto" },
                        { fetch_format: "auto" }
                    ]
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary Error:', error);
                        return reject(new Error("File upload failed"));
                    }
                    if (result?.secure_url) {
                        return resolve(result.secure_url);
                    }
                    return reject(new Error("Upload completed but no URL returned"));
                }
            );
            upload_stream.end(fileBuffer);
        });
    }

    async deleteFromCloudinary(publicId) {
        try {
            const result = await cloudinary.uploader.destroy(publicId, { 
                resource_type: "auto" 
            });
            return result.result === "ok";
        } catch (error) {
            console.error('Delete Error:', error);
            return false;
        }
    }
}

module.exports = { CloudUploader };
