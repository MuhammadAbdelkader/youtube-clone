const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudUploader {
    constructor() { }

    async uploadToCloudinary(fileBuffer) {
        return new Promise((resolve, reject) => {
            let upload_stream = cloudinary.uploader.upload_stream(
                { resource_type: "auto" },
                (error, result) => {
                    if (error) {
                        return reject(new Error("Cloudinary upload error", { cause: 400 }));
                    }
                    if (result?.secure_url) {
                        return resolve(result.secure_url);
                    }
                    return reject(new Error("Cloudinary returned no URL", { cause: 500 }));
                }
            );
            upload_stream.end(fileBuffer);
        });
    }

    async removeOldFile(url) {
        try {
            const segments = url.split("/");
            const publicId = segments[segments.length - 1].split(".")[0];
            let result;
            if (publicId) {
                result = await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
            }

            if (result.result === "ok") {
                console.log("File deleted successfully");
            } else {
                throw new Error("Error deleting image", { cause: 400 });
            }
        } catch (error) {
            throw new Error("Error deleting image", { cause: 400 });
        }
    }
}
module.exports = {
    CloudUploader
};