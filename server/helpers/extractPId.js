const extractPublicId = (cloudinaryUrl) => {
    try {
        const urlParts = cloudinaryUrl.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');

        if (uploadIndex === -1) return null;

        let pathAfterUpload = urlParts.slice(uploadIndex + 1);

        if (pathAfterUpload[0] && pathAfterUpload[0].match(/^v\d+$/)) {
            pathAfterUpload = pathAfterUpload.slice(1);
        }

        const publicId = pathAfterUpload.join('/').replace(/\.[^/.]+$/, '');
        return publicId;
    } catch (error) {
        return null;
    }
};
module.exports = extractPublicId;