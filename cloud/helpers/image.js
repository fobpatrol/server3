'use strict'
const sharp = require('sharp')

module.exports = {
    resize:           resize,
    resizeUrl:        resizeUrl,
    saveImage:        saveImage,
    progressive:      progressive,
    base64toBuffer:   base64toBuffer,
    ParseHttpRequest: ParseHttpRequest,
}

function base64toBuffer(base64) {
    return new Buffer.from(base64, 'base64').toString('ascii')
}

function bufferToBase64(buffer) {
    console.log('converte buffer', buffer)
    return buffer.toString('base64')
}

function ParseHttpRequest(url) {
    return Parse.Cloud.httpRequest({url: url})
}

function resizeUrl(url, width) {
    return ParseHttpRequest(url)
        .then(body => {
            console.log('request', body)
            if (body.code !== 141) {
                return resize(body.buffer, width)
            } else {
                return Parse.Promise.error()
            }
        })
}

function resize(buffer, width) {
    return new Promise((resolve, reject) => {
        sharp(buffer)
            .resize(width)
            .embed()
            .raw()
            .webp({quality: 90})
            .toFormat(sharp.format.webp)
            .toBuffer((error, buffer) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(bufferToBase64(buffer))
                }
            })
    })
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
                        reject(error)
                    } else {
                        resolve(bufferToBase64(buffer))
                    }
                })
        })
    })
}

function saveImage(base64) {
    return new Parse.File('image.webp', {base64: base64}).save()
}