'use strict';

const
    bodyParser = require('body-parser'),
    config = require('config'),
    crypto = require('crypto'),
    express = require('express'),
    https = require('https'),
    messagingManager = require('./src/messaging-manager'),
    request = require('request');

var app = express();

app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');

// Allows us to process the data

app.use(bodyParser.json({
    verify: verifyRequestSignature
}));
app.use(express.static('public'));


const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
    process.env.MESSENGER_APP_SECRET :
    config.get('appSecret');

const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
    (process.env.MESSENGER_VALIDATION_TOKEN) :
    config.get('validationToken');

const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
    (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
    config.get('pageAccessToken');

const SERVER_URL = (process.env.SERVER_URL) ?
    (process.env.SERVER_URL) :
    config.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
    console.error("Missing config values");
    process.exit(1);
}

// ROUTES

// Facebook
app.get('/webhook', function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === VALIDATION_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

app.post('/webhook', function(req, res) {
    var data = req.body;

    // Make sure this is a page subscription
    if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function(pageEntry) {
            var pageID = pageEntry.id;
            var timeOfEvent = pageEntry.time;

            // Iterate over each messaging event
            pageEntry.messaging.forEach(function(messagingEvent) {
                if (messagingEvent.message) {
                    messagingManager.receivedMessage(messagingEvent);
                } else if (messagingEvent.postback) {
                    if (messagingEvent.postback.payload === 'MENU_PAYLOAD') {
                        messagingManager.sendIntroductionMessage(messagingEvent.sender.id);

                    } else if (messagingEvent.postback.payload === 'ADVISOR_PAYLOAD') {
                        messagingManager.sendAdvisorContacts(messagingEvent.sender.id);
                    } else {
                        messagingManager.sendIntroductionMessage(messagingEvent.sender.id);
                    }
                }

                // if (messagingEvent.message) {
                //   messagingManager.receivedMessage(messagingEvent);
                // } else if (messagingEvent.postback){
                //   messagingManager.sendIntroductionMessage(messagingEvent.sender.id);
                // }
                // if (messagingEvent.optin) {
                //   receivedAuthentication(messagingEvent);
                // } else if (messagingEvent.message) {
                //   receivedMessage(messagingEvent);
                // } else if (messagingEvent.delivery) {
                //   receivedDeliveryConfirmation(messagingEvent);
                // } else if (messagingEvent.postback) {
                //   receivedPostback(messagingEvent);
                // } else if (messagingEvent.read) {
                //   receivedMessageRead(messagingEvent);
                // } else if (messagingEvent.account_linking) {
                //   receivedAccountLink(messagingEvent);
                // } else {
                //   console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                // }
            });
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know you've
        // successfully received the callback. Otherwise, the request will time out.
        res.sendStatus(200);
    }
});

function verifyRequestSignature(req, res, buf) {
    var signature = req.headers["x-hub-signature"];

    if (!signature) {
        // For testing, let's log an error. In production, you should throw an
        // error.
        console.error("Couldn't validate the signature.");
    } else {
        var elements = signature.split('=');
        var method = elements[0];
        var signatureHash = elements[1];

        var expectedHash = crypto.createHmac('sha1', APP_SECRET)
            .update(buf)
            .digest('hex');

        if (signatureHash != expectedHash) {
            throw new Error("Couldn't validate the request signature.");
        }
    }
}

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

module.exports = app;