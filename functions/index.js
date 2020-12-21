// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const functions = require('firebase-functions');
const admin = require('firebase-admin');
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

exports.createThumbnailFromAsset = functions.firestore
    .document('assets/{assetId}')
    .onCreate(async (snap, context) => {
        // Get an object representing the document
        // e.g. {'name': 'Marie', 'age': 66}
        const asset = snap.data();
        console.log('snap',snap)
        console.log('context',context)

        const file = functions.storage.bucket().file(`asset.thumbnailURL`);
        const metaData = await file.getMetaData();
        asset['thumbnails']['small'] = metaData[0].mediaLink
        // access a particular field as you would any JS property

    return     admin.firestore().doc('assets/' + asset.uid).set(asset);
        // perform desired operations ...
    });
