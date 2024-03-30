// server.js
//
// Use this sample code to handle webhook events in your integration.
//
// 1) Paste this code into a new file (server.js)
//
// 2) Install dependencies
//   npm install stripe
//   npm install express
//
// 3) Run the server on http://localhost:4242
//   node server.js
//
// 4) stripe listen --forward-to localhost:4242/webhook (in a separate terminal window, in the same directory)

// The library needs to be configured with your account's secret key.
// Ensure the key is kept out of any version control system you might be using.
const stripe = require('stripe')('sk_test_...');
const express = require('express');
const https = require('https');
const app = express();
const admin = require('firebase-admin');


// This is your Stripe CLI webhook secret for testing your endpoint locally.
// This secrete can be gotten from the stripe CLI by running the command: stripe listen --print-secret
const endpointSecret = "Stripe CLI webhook secret for testing locally";

//this is the service account key for the firebase project
//this is used to authenticate the app with the firebase project
//this key is gotten from the firebase project settings
const serviceAccount = require('./park-ease-afe56-firebase-adminsdk-v8l08-ea8a2d22ca.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    // console.log(event);
    // console.log("Body: " + request.body);
    // console.log("Request: " + request);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.async_payment_failed':
      const checkoutSessionAsyncPaymentFailed = event.data.object;
      // Then define and call a function to handle the event checkout.session.async_payment_failed
      console.info("Payment failed:");
      // Send a push notification to notify the user that their payment failed
      break;
    case 'checkout.session.async_payment_succeeded':
      const checkoutSessionAsyncPaymentSucceeded = event.data.object;
      // Then define and call a function to handle the event checkout.session.async_payment_succeeded
      console.log(checkoutSessionCompleted);
      console.log("Payment was successful! Trigger push notification to user.");
      break;
    case 'checkout.session.completed':
      const checkoutSessionCompleted = event.data.object;
      // Then define and call a function to handle the event checkout.session.completed
      console.log(checkoutSessionCompleted);
      console.log("Payment was successful! Trigger push notification to user.");

      // Save payment data to Firestore
      savePaymentDataToFirestore(event).then(() => {
        console.log("Done Saving");
      });
      
      break;
    case 'checkout.session.expired':
      const checkoutSessionExpired = event.data.object;
      // Then define and call a function to handle the event checkout.session.expired
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

// Function to trigger the cloud function
async function savePaymentDataToFirestore(event) {
  // Payment data to be saved to Firestore
  const paymentData = {
    "paymentId": event.data.object.id,
    "amount": event.data.object.amount_total,
    "currency": event.data.object.currency,
    "paymentStatus": event.data.object.payment_status,
    "paymentMethod": event.data.object.payment_method_types[0],
    "paymentLink": event.data.object.payment_link,
    "email": event.data.object.customer_details.email,
    "date": Date.now(),
  };

  const checkoutSession = event.data.object;
  console.log("checkoutSession: ", checkoutSession);

  const firestore = admin.firestore();
  const collectionRef = firestore.collection('payments');
  await collectionRef.add(paymentData);
}

app.listen(4242, () => console.log('Running on port 4242'));