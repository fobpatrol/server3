'use strict';
const sharp   = require('sharp');

module.exports = {
    resize        : resize,
    saveImage     : saveImage,
    progressive   : progressive,
    base64toBuffer: base64toBuffer,
};

function base64toBuffer(base64) {
    return new Buffer.from(base64, 'base64').toString('ascii');
}

function bufferToBase64(buffer) {
    console.log('converte buffer', buffer);
    return buffer.toString('base64');
}

function resize(url, width) {
    return new Promise((resolve, reject) => {
        Parse.Cloud.httpRequest({url: url}).then(body => {
            sharp(body.buffer)
                .resize(width)
                .embed()
                .raw()
                .webp({quality: 90})
                .toFormat(sharp.format.webp)
                .toBuffer((error, buffer) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(bufferToBase64(buffer))
                    }
                });
        })
    });
}


function progressive(url, width) {
    return new Promise((resolve, reject) => {
        Parse.Cloud.httpRequest({url: url}).then(body => {
            sharp(body.buffer)
                .resize(width)
                .embed()
                .raw()
                .blur(20)
                .webp({quality: 80})
                .toFormat(sharp.format.webp)
                .toBuffer((error, buffer) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(bufferToBase64(buffer))
                    }
                });
        })
    });
}

function saveImage(base64) {
    return new Parse.File('image.webp', {base64: base64}).save();
}