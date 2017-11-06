'use strict';

const graphApi = require('./graph-api.js');
const soilTestingCenters = require("../database/SoilTestingCenters.json");


function sendIntroductionMessage(recipientId) {
  const introduction = {
    recipient: {
      id: recipientId
    },
    message: require('../messages/introduction.json')
  };

  const callToAction = {
    recipient: {
      id: recipientId
    },
    message: require('../messages/call-to-action.json')
  };

  graphApi.callSendAPI(introduction)
    .then(() => graphApi.callSendAPI(callToAction));
}

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (quickReply) {
    if (messageText.toUpperCase() === 'LOCATIONS') {
      sendLocationList(senderID);
    } else if (messageText.toUpperCase() === 'DO SOIL TESTING') {
      sendSoilTestingProcedure(senderID);
    }
  } else if (messageAttachments) {
    var lat = null;
    var long = null;
    if (messageAttachments[0].payload.coordinates) {
      lat = messageAttachments[0].payload.coordinates.lat;
      long = messageAttachments[0].payload.coordinates.long;
    }
    sendNearestSoilTestingCenter(senderID, lat, long);
  }
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  graphApi.callSendAPI(messageData);
}

function sendSoilTestingOptions(recipientId) {
  var options = {
    recipient: {
      id: recipientId
    },
    message: require('../messages/soil-testing-options.json')
  };
  graphApi.callSendAPI(options);
}

function sendSoilTestingProcedure(recipientId) {
  var procedure = {
    recipient: {
      id: recipientId
    },
    message: require('../messages/soil-testing-procedure.json')
  };
  graphApi.callSendAPI(procedure);
}

function sendNearestSoilTestingCenter(recipientId, lat, long) {

  var distance = []

  // From the database, get the distances to the user's location
  for (var i = 0; i < soilTestingCenters.length; i++) {
    var lat1 = soilTestingCenters[i].latitude;
    var long1 = soilTestingCenters[i].longitude;
    distance.push(haversine(lat, long, lat1, long1));
  }

  // Get the index of the smallest distance to the user
  var j = distance.indexOf(Math.min.apply(Math, distance));

  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: soilTestingCenters[j].center_name,
            subtitle: soilTestingCenters[j].center_location,
            image_url: soilTestingCenters[j].center_image,
            buttons: [{
              type: "phone_number",
              payload: soilTestingCenters[j].center_number,
              title: "Book now"
            }, ],
          }]
        }
      }
    }
  };

  // var temp_message = "The nearest soil testing center is"
  //   var locationMessage = {
  //     recipient: {
  //       id: recipientId
  //     },
  //     message: temp_message
  //   }
  // var locationMessage = {
  //   recipient: {
  //     id: recipientId
  //   },
  //   message: "The nearest soil testing center is"
  // };
  graphApi.callSendAPI(messageData);

  // const messages$ = messages.reduce((promise, item) => {
  //   return promise
  //     .then(() => graphApi.callSendAPI(item));
  // }, Promise.resolve());
  //
  // messages$
  //   .then(() => false);
  // graphApi.callSendAPI(locationMessage)
  // .then(() => graphApi.callSendAPI(messageData));

}

function sendAdvisorContacts(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Contact Us",
            subtitle: "",
            image_url: "http://img.freepik.com/free-vector/cell-phone-chat_1325-51.jpg?size=338&ext=jpg",
            buttons: [{
              type: "phone_number",
              payload: "+254716043718",
              title: "Call Representative"
            }, ],
          }]
        }
      }
    }
  };

  graphApi.callSendAPI(messageData);

}

// Function that determines the distance between the user and the location given of the soil testing center
function haversine() {
  var radians = Array.prototype.map.call(arguments, function(deg) {
    return deg / 180.0 * Math.PI;
  });
  var lat1 = radians[0],
    lon1 = radians[1],
    lat2 = radians[2],
    lon2 = radians[3];
  var R = 6372.8; // km
  var dLat = lat2 - lat1;
  var dLon = lon2 - lon1;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
}

// Sends the list of locations available
function sendLocationList(recipientId) {
  var messageData = {
      recipient: {
          id: recipientId
      },
      message: {
          attachment: {
              type: "template",
              payload: {
                  template_type: "generic",
                  elements: [{
                      title: soilTestingCenters[0].center_name,
                      subtitle: soilTestingCenters[0].center_location,
                      image_url: soilTestingCenters[0].center_image,
                      buttons: [{
                          type: "postback",
                          payload: "vanilla_plain_cake",
                          title: "Book now"
                      },],
                  }, {
                      title: soilTestingCenters[1].center_name,
                      subtitle: soilTestingCenters[1].center_location,
                      image_url: soilTestingCenters[1].center_image,
                      buttons: [{
                          type: "postback",
                          payload: "banana_plain_cake",
                          title: "Book now"
                      },],
                  }, {
                      title: soilTestingCenters[2].center_name,
                      subtitle: soilTestingCenters[2].center_location,
                      image_url: soilTestingCenters[2].center_image,
                      buttons: [{
                          type: "postback",
                          payload: "carrot_plain_cake",
                          title: "Book now"
                      },],
                  },
                  {
                    title: soilTestingCenters[3].center_name,
                    subtitle: soilTestingCenters[3].center_location,
                    image_url: soilTestingCenters[3].center_image,
                    buttons: [{
                        type: "postback",
                        payload: "carrot_plain_cake",
                        title: "Book now"
                    },],
                }]
              }
          }
      }
  };

  const messageData2 = {
      recipient: {
          id: recipientId
      },
      message: {
          "text": "Here is the list of locations we have."
      }
  };

  graphApi.callSendAPI(messageData2).then(() => graphApi.callSendAPI(messageData));

}

module.exports = {
  receivedMessage,
  sendIntroductionMessage,
  sendAdvisorContacts,
};
