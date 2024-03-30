const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

exports.checkInDriver = onRequest({
  minInstances: 1,
  maxInstances: 10,
}, async (req, res) => {
  let deviceId;
  let driverId;

  // find reservation by code
  const code = parseInt(req.query.code);
  // const queryDeviceId = req.query.device_d;
  const reservationRef = db.collection("reservation");
  const snapShot = await reservationRef
      .where("checkInCode", "==", code).limit(1).get();
  if (snapShot.empty) {
    logger.log("No Data Found!");
    return res.json({result: "error"});
  }
  snapShot.forEach((doc) => {
    console.log(doc.data().driverId);
    console.log(doc.data().deviceId);
    driverId = doc.data().driverId;
    deviceId = doc.data().deviceId;
  });

  // add to checkIn collection
  const checkInLogRef = db.collection("checkInLog");
  const writeResult = await checkInLogRef.add({
    checkInTime: Date.now(),
    checkOutTime: null,
    date: Date.now(),
    deviceId: deviceId,
    driverId: driverId,
  });

  if (writeResult.empty) {
    logger.log("Error saving data to checkInLog");
    return res.json({result: "error"});
  }

  console.log(`checkIn document with id ${writeResult.id} saved successfully!`);

  return res.json({result: "success"});
});
