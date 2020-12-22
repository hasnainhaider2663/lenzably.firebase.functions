// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');
admin.initializeApp();


exports.createProfile = functions.auth.user().onCreate((user) => {
    functions.logger.log("my user", user);
    const userObject = {
        displayName: user.displayName,
        email: user.email,
        uid: user.uid,
        emailVerified: user.emailVerified,
        avatar: user.photoURL,
    };


    return admin.firestore().doc('users/' + user.uid).set(userObject);

});
exports.onOriginalAssetFileUpload = functions.storage.object().onFinalize(async (object) => {
// [END generateThumbnailTrigger]
    // [START eventAttributes]
    const fileBucket = object.bucket; // The Storage bucket that contains the file.
    const filePath = object.name; // File path in the bucket.
    const contentType = object.contentType; // File content type.
    const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.
    // [END eventAttributes]

    // [START stopConditions]
    // Exit if this is triggered on a file that is not an image.
    if (!contentType.startsWith('image/')) {
        return console.log('This is not an image.');
    }

    // Get the file name.
    const fileName = path.basename(filePath);
    // Exit if the image is already a thumbnail.
    if (fileName.startsWith('thumb_')) {
        return console.log('Already a Thumbnail.');
    }
    // [END stopConditions]

    // [START thumbnailGeneration]
    // Download file from bucket.
    const bucket = admin.storage().bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const metadata = {
        contentType: contentType,
    };
    await bucket.file(filePath).download({destination: tempFilePath});
    console.log('Image downloaded locally to', tempFilePath);


















    // Generate a thumbnail using ImageMagick.
    await spawn('convert', [tempFilePath, '-thumbnail', '200x200>', tempFilePath]);
    console.log('Thumbnail created at', tempFilePath);
    // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
    const thumbFileName = `thumb_${fileName}`;
    const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
    // Uploading the thumbnail.
    await bucket.upload(tempFilePath, {
        destination: thumbFilePath,
        metadata: metadata,
    });
    // Once the thumbnail has been uploaded delete the local file to free up disk space.
    return fs.unlinkSync(tempFilePath);
    // [END thumbnailGeneration]
});
exports.createThumbnailFromAsset = functions.firestore
    .document('assets/{assetId}')
    .onUpdate(async (snap, context) => {


        // Get an object representing the document
        // e.g. {'name': 'Marie', 'age': 66}
        const snapData = snap.after.data();
        const assetId = context.params.assetId;
        console.log('assetId', assetId);
        console.log('snap', snap);
        console.log('context', context);


        const file = admin.storage().bucket('freedom-collective.appspot.com').file(`assets/${snapData.userId}/${assetId}`).makePublic();

        const metaData = await file.getMetadata()
        const url = metaData[0].mediaLink
        let asset = {}
        console.log('url', url)
        // const file = functions.storage.bucket().file(`${asset.fullPath}`);
        // const metaData = await file.getMetaData();
        asset['thumbnails'] = {};
        asset['thumbnails']['small'] = url;
        // access a particular field as you would any JS property

        return admin.firestore().doc('assets/' + assetId).update(asset);
        // perform desired operations ...
    });
