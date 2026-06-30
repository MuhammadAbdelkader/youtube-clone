const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Pipes a Buffer as a readable stream directly into Cloudinary's upload stream.
 * Avoids loading the entire file into RAM beyond what multer already holds.
 *
 * @param {Buffer} buffer   - File buffer from multer memoryStorage
 * @param {object} options  - Cloudinary upload options
 * @returns {Promise<{ secure_url: string, public_id: string, duration?: number }>}
 */
function streamUpload(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        if (!result?.secure_url) {
          return reject(new Error("Cloudinary returned no URL"));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          duration: result.duration || null,
          format: result.format || null,
          bytes: result.bytes || null,
        });
      }
    );

    // Pipe the buffer into the cloudinary stream — zero extra RAM copy
    Readable.from(buffer).pipe(uploadStream);
  });
}

/**
 * Upload a video buffer directly to Cloudinary via stream.
 * @param {Buffer} buffer
 * @param {string} [folder="youcube/videos"]
 */
async function uploadVideo(buffer, folder = "youcube/videos") {
  return streamUpload(buffer, {
    resource_type: "video",
    folder,
    chunk_size: 6_000_000, // 6 MB chunks for resumable uploads
  });
}

/**
 * Upload an image buffer (avatar, thumbnail) to Cloudinary via stream.
 * @param {Buffer} buffer
 * @param {string} [folder="youcube/images"]
 */
async function uploadImage(buffer, folder = "youcube/images") {
  return streamUpload(buffer, {
    resource_type: "image",
    folder,
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });
}

/**
 * Delete a Cloudinary asset by its full public_id.
 * Correctly handles folder-prefixed public_ids (e.g., "youcube/videos/abc123").
 * @param {string} publicId  - Full Cloudinary public_id
 * @param {"video"|"image"|"raw"} [resourceType="image"]
 */
async function deleteAsset(publicId, resourceType = "image") {
  if (!publicId) return;
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary delete failed for ${publicId}: ${result.result}`);
  }
  return result;
}

module.exports = { uploadVideo, uploadImage, deleteAsset };