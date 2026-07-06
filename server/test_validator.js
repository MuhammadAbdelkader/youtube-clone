const { body, validationResult } = require('express-validator');

const validateVideo = [
    body('title').escape().notEmpty().withMessage('Title required'),
    body('description').escape().notEmpty().withMessage('Description required'),
    body('video').custom((value, { req }) => {
        if (!req.file) {
            throw new Error('Video file required');
        }
        return true;
    }),
];

async function test() {
    const req = {
        body: {
            title: 'وأجز دعواهم أن الحمد لله رب العالمين | سورة يونس (من الآية 10)',
            description: 'سورة يونس (من الآية 10) | الشيخ محمد صديق المنشاوي'
        },
        file: { mimetype: 'video/mp4', size: 1000 }
    };
    
    for (let validator of validateVideo) {
        await validator.run(req);
    }
    
    const errors = validationResult(req);
    console.log(errors.array());
}

test();
