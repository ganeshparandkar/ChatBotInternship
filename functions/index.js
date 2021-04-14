/* -----
Declaration Part
-------*/
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const keys = require('./key.json');
const axios = require('axios');
/* -----
Spreadsheet connectivity
-------*/
let sheetData = [];
let sheetProducts = [];
let foodItems = [];

admin.initializeApp({
  databaseURL: 'https://ct-chat-bot-2021-default-rtdb.firebaseio.com',
});
let database = admin.database();

const client = new google.auth.JWT(keys.client_email, null, keys.private_key, [
  'https://www.googleapis.com/auth/spreadsheets',
]);

function arrtoobject(array) {
  return array.reduce(function (result, currentArray) {
    result[currentArray[0]] = currentArray[1];
    return result;
  }, {});
}
function pincodeToAdminNo(array) {
  return array.reduce(function (result, currentArray) {
    result[currentArray[0]] = currentArray[2];
    return result;
  }, {});
}

client.authorize((err, tokens) => {
  if (err) {
    return; // just get out from the function
  } else {
    gsrun(client).then((data) => {
      sheetData = data[0];
      let mapAdminPhone = pincodeToAdminNo(sheetData);
      let areaData = arrtoobject(sheetData);
      sheetProducts = data[1];
      let productDetails = arrtoobject(sheetProducts);
      let temp = sheetProducts.map((e) => e[1].toUpperCase());
      foodItems = temp;
      database.ref('chatbot').child('MyData').child('foodItem').set(temp);
      database
        .ref('chatbot')
        .child('MyData')
        .child('SheetProduct')
        .set(productDetails);
      database.ref('chatbot').child('MyData').child('SheetArea').set(areaData);
      database
        .ref('chatbot')
        .child('MyData')
        .child('PincodeWithAdminNo')
        .set(mapAdminPhone);
    });
  }
});

/* -----
database connectivity
-------*/

var gsrun = async (cl) => {
  const gsapi = google.sheets({
    version: 'v4',
    auth: cl,
  });

  const Areasheet = {
    spreadsheetId: '1PorRlxlCbXveAtXBicBGfn6UFGVt9VZ5hqDtyBzOW9Q', // Pincodes Area address
    range: 'Sheet1!A1:C100',
  };

  const productSheet = {
    spreadsheetId: '1kK2_2s3kwhAzK2LrwFfOFXZWl45WD-wr0fSgOpqrgDw', // food menus
    range: 'Sheet1!A1:C100',
  };

  let data = await gsapi.spreadsheets.values.get(Areasheet);
  let areaSheet = data.data.values;

  let products = await gsapi.spreadsheets.values.get(productSheet);
  let productArr = products.data.values;

  let sheets = [areaSheet, productArr];

  return sheets;
};

exports.apicall = functions.https.onRequest((req, res) => {
  const getAdminPhone = (pincode_AdminNumbers, currentPin) => {
    if (Object.keys(pincode_AdminNumbers).includes(currentPin)) {
      console.log(currentPin);
      let index = Object.keys(pincode_AdminNumbers).indexOf(inputdata) + 1;
      console.log(index);
      console.log(Object.values(pincode_AdminNumbers));
      adminNo = Object.values(pincode_AdminNumbers)[index];
      console.log(Object.values(pincode_AdminNumbers)[index]);
      //! here we got the number of admin according to perticular pincode! now send the msg of orders to the admin;
      console.log('adminNo ===', adminNo);
      return adminNo;
    } else {
      console.log('There is no admin No.');
      return null;
    }
  };
  /* --------
  ! to get all product in one row
  --------------*/
  const getAllOrderedItems = (productRef, FoodItems) => {
    let keys = Object.keys(productRef);
    let AllProducts = [];
    for (let i = 0; i < keys.length; i++) {
      let pName = FoodItems[keys[i] - 1];
      AllProducts.push(
        `${pName},${productRef[keys[i]].Quantity},${productRef[keys[i]].slices}`
      );
    }
    let singleLineProducts = AllProducts.join(`  |  `);
    return singleLineProducts;
  };
  // ----------------------------------------------------------------------------------
  const sendMsgFromBot = (number, msg) => {
    //! change {source,botName,apiKey } according to bot
    const checkNo = (phoneNumber) => {
      if (phoneNumber.toString().slice(0, 2) == 91) {
        return phoneNumber;
      } else {
        return `91${phoneNumber}`;
      }
    };
    let newNumber = checkNo(number);
    console.log('infunc No', newNumber);
    let destination = newNumber;

    // ! trialBot
    // ?---------------------------------------------------------------
    // var source = '917834811114';
    // let botName = 'TestShriyashApi';
    // let apiKey = 'ng9x1glfai42vpvv7rrpvtefe2l8jleg';
    // ?---------------------------------------------------------------
    // ! ProductionBot
    // ?---------------------------------------------------------------
    var source = '917795662042';
    let botName = 'Meatable';
    let apiKey = 'xbfjxahyq0k6xe1gtvahda9rygomfhpo';
    // ?---------------------------------------------------------------

    var config = {
      method: 'post',
      url: `https://api.gupshup.io/sm/api/v1/msg?channel=whatsapp&source=${source}&destination=${destination}&message=${msg}&src.name=${botName}`,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded',
        apikey: apiKey,
        'cache-control': 'no-cache',
      },
    };
    axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  const data = req.body.payload.payload;
  const userData = req.body.payload;
  const inputdata = data.text;
  const menuCard = [
    {
      type: 'image',
      originalUrl: `https://firebasestorage.googleapis.com/v0/b/ct-chat-bot-2021.appspot.com/o/Meatable%20Menu.jpg?alt=media&token=e2032a43-1f35-44aa-a85d-0f1e0c6ccb35`,
      previewUrl: `https://firebasestorage.googleapis.com/v0/b/ct-chat-bot-2021.appspot.com/o/Meatable%20Menu.jpg?alt=media&token=e2032a43-1f35-44aa-a85d-0f1e0c6ccb35`,
      caption: 'Menu Card',
    },
  ];
// !====================================================================================================
// !====================================================================================================
// !====================================================================================================
  if (req.method == 'POST') {
    var date, time, timestamp, phone;

    database.ref('chatbot').once('value', (snap) => {
      phone = userData.sender.phone.toString();

      if (snap.hasChild(phone)) {
        if (inputdata.toLowerCase() == 'cls') {
          database
            .ref('chatbot')
            .child(userData.sender.phone.toString())
            .remove();
        }
        let mainTimestamp = snap.child(phone).val().timestamp;
        let count = snap
          .child(phone)
          .child('History')
          .child(mainTimestamp)
          .val().count;

        var todayDateTime = new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
        });
        time = todayDateTime.split(' ')[1];

        date = todayDateTime.split(' ')[0];
        date = date.split('/');
        date = `${date[0]},${date[1]},${date[2]}`;
        date = date.slice(0, -1);
        timestamp = date + '|' + time;

        if (count == 6) {
          let foodItems = snap.child('MyData').child('foodItem').val();

          let productref = snap
            .child(phone)
            .child('History')
            .child(mainTimestamp)
            .child('Product')
            .val();

          let allProductList = getAllOrderedItems(productref, foodItems);

          database
            .ref(`chatbot`)
            .child(phone)
            .child('History')
            .child(mainTimestamp)
            .child('ProductDetails')
            .set(allProductList);

          database
            .ref(`chatbot`)
            .child(phone)
            .child('History')
            .child(mainTimestamp)
            .child('Messages')
            .child(time)
            .set(inputdata);
          database
            .ref('chatbot')
            .child(phone)
            .child('History')
            .child(mainTimestamp)
            .child('count')
            .set(7);
          res.send(
            `Your last order was\n\n${allProductList}\n\nPress 1 for re-order.
            \nPress 2 for new order.`
          );
        }
        if (count == 7) {
          let foodItems = snap.child('MyData').child('foodItem').val();

          if (inputdata == 1) {
            let oldproduct = snap
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('Product')
              .val();

            database
              .ref('chatbot')
              .child(phone)
              .child('timestamp')
              .set(timestamp);

            database
              .ref('chatbot')
              .child(phone)
              .child('History')
              .child(timestamp)
              .set({
                count: 6,
              });
            database
              .ref('chatbot')
              .child(phone)
              .child('History')
              .child(timestamp)
              .child('Product')
              .set(oldproduct);
            //!---------------------
            let pincode_AdminNumbers = snap
              .child('MyData')
              .child('PincodeWithAdminNo')
              .val();
            let name = snap.child(phone).val().name;
            let address = snap.child(phone).val().Address;
            let pincode = snap.child(phone).val().pincode;
            let areaCode = snap.child(phone).val().areaCode;
            let productref = snap
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('Product')
              .val();

            let adminNo = getAdminPhone(pincode_AdminNumbers, pincode);

            let product = getAllOrderedItems(productref, foodItems);
            let tempArray = product.split('  |  ');
            let finalOrderDetails = tempArray.join('\n');

            let message = `New order has been placed.\n\n${phone}\n${name}\n\n${finalOrderDetails}`;

            sendMsgFromBot(adminNo, message);

            //!---------------------
            saveData(
              mainTimestamp,
              phone,
              name,
              product,
              address,
              pincode,
              areaCode
            );
            res.send(
              'Thanks for ordering with us. We will soon update you with the status.'
            );
          } else if (inputdata == 2) {
            database
              .ref('chatbot')
              .child(phone)
              .child('timestamp')
              .set(timestamp);
            database
              .ref('chatbot')
              .child(phone)
              .child('History')
              .child(timestamp)
              .child('Messages')
              .child(time)
              .set(inputdata);
            database
              .ref('chatbot')
              .child(phone)
              .child('History')
              .child(timestamp)
              .child('count')
              .set(3);
            res.send(menuCard);
            let msg = `Please enter ItemId and quantity`;
            sendMsgFromBot(phone, msg);
          } else {
            res.send('please enter valid Input!');
          }
        }

        if (count == 1) {
          // var cityPoints = checkPin(inputdata);

          let areaAndPincodeSheet = snap
            .child('MyData')
            .child('SheetArea')
            .val();
          if (Object.keys(areaAndPincodeSheet).includes(inputdata)) {
            let index = Object.keys(areaAndPincodeSheet).indexOf(inputdata);
            database
              .ref('chatbot')
              .child(userData.sender.phone)
              .child('pincode')
              .set(inputdata);
            database
              .ref('chatbot')
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('count')
              .set(2);
            database
              .ref(`chatbot`)
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('Messages')
              .child(time)
              .set(inputdata);
            res.send(
              `We serve the following areas,\n ${
                Object.values(areaAndPincodeSheet)[index]
              }\nPlease choose an area.`
            );
          } else {
            res.send(
              'We dont provide out services to this address.\n please try different pin.'
            );
          }
        }
        if (count == 2) {
          database
            .ref(`chatbot`)
            .child(phone)
            .child('History')
            .child(mainTimestamp)
            .child('Messages')
            .child(time)
            .set(inputdata);
          database
            .ref('chatbot')
            .child(phone)
            .child('History')
            .child(mainTimestamp)
            .child('count')
            .set(3);
          database
            .ref('chatbot')
            .child(userData.sender.phone)
            .child('areaCode')
            .set(inputdata);
          res.send(menuCard);
          let msg = 'Please enter ItemId and quantity';
          sendMsgFromBot(phone, msg);
        }
        if (count == 3) {
          var productArr = inputdata.split(' ');
          let name = productArr[0].toUpperCase();
          if (name != 'X') {
            if (isNaN(productArr[0])) {
              //! its product name or other name
              let foodItems = snap.child('MyData').child('foodItem').val();
              if (foodItems.includes(name)) {
                let productId = foodItems.indexOf(name) + 1;
                database
                  .ref(`chatbot`)
                  .child(phone)
                  .child('History')
                  .child(mainTimestamp)
                  .child('Messages')
                  .child(time)
                  .set(inputdata);

                database
                  .ref('chatbot')
                  .child(userData.sender.phone)
                  .child('History')
                  .child(mainTimestamp)
                  .child('Product')
                  .child(productId)
                  .set({
                    item: name,
                    Quantity: productArr[1],
                  });

                res.send(
                  'Please enter next item and quantity\nPress x to finish'
                );
              } else {
                res.send(
                  'We Dont Have That Product Please Check Again and Order another product! 1'
                );
              }
            } else {
              //! it is a number

              let inputId = Number(name);
              let foodItems = snap.child('MyData').child('foodItem').val();

              if (inputId != 0 && inputId <= foodItems.length) {
                let productName = foodItems[inputId - 1];
                database
                  .ref(`chatbot`)
                  .child(phone)
                  .child('History')
                  .child(mainTimestamp)
                  .child('Messages')
                  .child(time)
                  .set(inputdata);

                database
                  .ref('chatbot')
                  .child(userData.sender.phone)
                  .child('History')
                  .child(mainTimestamp)
                  .child('Product')
                  .child(inputId)
                  .set({
                    item: productName,
                    Quantity: productArr[1],
                  });

                res.send(
                  'please enter next item and quantity\npress x to finish'
                );
              } else {
                res.send(
                  'We Dont Have That Product Please Check Again and Order another product!'
                );
              }
            }
          } else {
            //!here you will terminate the loop Input is X

            database
              .ref('chatbot')
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('count')
              .set(4);

            var a = snap
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .val();
            // let arr = a.Product;
            // let keysarr = Object.keys(arr);
            // let pId = keysarr[0];
            // pId = Number(pId);
            // let productarr = getImageandDish(pId);
            // !==============
            let productList = a.Product;
            let indexes = Object.keys(productList);

            let changeThisProduct = productList[indexes[0]];
            let productName = changeThisProduct.item;

            database
              .ref('chatbot')
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('ProductIdForCut')
              .set(indexes[0]);
            res.send(`How would you like the cut for ${productName} ?`);
          }
        }

        if (count == 4) {
          cutval = snap.child(phone).child('History').child(mainTimestamp).val()
            .ProductIdForCut;
          var a = snap.child(phone).child('History').child(mainTimestamp).val();
          let arr = a.Product; //  ['chickn','finsh','bla']

          let foodItems = snap.child('MyData').child('foodItem').val();

          if (cutval != 'done') {
            database
              .ref('chatbot')
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('Product')
              .child(cutval)
              .child('slices')
              .set(inputdata);

            let keysarr = Object.keys(arr); //[1,2,3]

            for (let i = 1; i < keysarr.length; i++) {
              if (
                arr[keysarr[i]].hasOwnProperty('slices') ||
                keysarr[i] == cutval
              ) {
              } else {
                // var productarr = getImageandDish(keysarr[i]);
                // pName = productarr[1];
                let productName = foodItems[keysarr[i] - 1];
                database
                  .ref('chatbot')
                  .child(phone)
                  .child('History')
                  .child(mainTimestamp)
                  .child('ProductIdForCut')
                  .set(keysarr[i]);
                res.send(`How would you like the cut for ${productName} ?`);
                break;
              }
            }
            // ?😅😅😅😅 check if address is available or not?
            let isAddressAvailable = snap.child(phone).hasChild('Address');
            if (isAddressAvailable) {
              // ? if available then ask if he want to change that address or not!
              let myAddress = snap.child(phone).child('Address').val();
              res.send(
                `is this your address ?\n${myAddress}\n\npress 1 -> yes \npress 2 -> no`
              );
              database
                .ref('chatbot')
                .child(phone)
                .child('History')
                .child(mainTimestamp)
                .child('count')
                .set(20);
            } else {
              // ! when address is not available (new user)
              database
                .ref('chatbot')
                .child(phone)
                .child('History')
                .child(mainTimestamp)
                .child('count')
                .set(5);
              res.send('Please enter your address');
            }
          }
        }

        if (count == 20) {
          if (inputdata == 1) {
            let address = snap.child(phone).val().Address;
            database
              .ref(`chatbot`)
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('Messages')
              .child(time)
              .set(inputdata);
            database
              .ref('chatbot')
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('count')
              .set(6);
            // *asd
            let foodItems = snap.child('MyData').child('foodItem').val();
            let pincode_AdminNumbers = snap
              .child('MyData')
              .child('PincodeWithAdminNo')
              .val();
            let productref = snap
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('Product')
              .val();
            let currentPin = snap.child(phone).child('pincode').val();

            let adminNo = getAdminPhone(pincode_AdminNumbers, currentPin);
            let product = getAllOrderedItems(productref, foodItems);
            let tempArray = product.split('  |  ');
            let finalOrderDetails = tempArray.join('\n');
            let name = snap.child(phone).val().name;
            let message = `New order has been placed.\n\n${phone}\n${name}\n\n${finalOrderDetails}`;
            sendMsgFromBot(adminNo, message);
            // *asd

            res.send(
              'Thanks for ordering with us. We will soon update you with the status.'
            );

            let pincode = currentPin;
            let areaCode = snap.child(phone).val().areaCode;
            saveData(
              mainTimestamp,
              phone,
              name,
              product,
              address,
              pincode,
              areaCode
            );
          } else if (inputdata == 2) {
            database
              .ref(`chatbot`)
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('Messages')
              .child(time)
              .set(inputdata);
            database
              .ref('chatbot')
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('count')
              .set(5);
            res.send('Please enter your address');
          } else {
            database
              .ref(`chatbot`)
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('Messages')
              .child(time)
              .set(inputdata);
            res.send('please enter valid Input!');
          }
        }

        if (count == 5) {
          let foodItems = snap.child('MyData').child('foodItem').val();
          //!---------------------
          let address;

          if (inputdata == 1) {
            address = snap.child(phone).child('Address').val();
          } else {
            address = inputdata;
            database
              .ref('chatbot')
              .child(userData.sender.phone)
              .child('Address')
              .set(inputdata);
          }
          let pincode = snap.child(phone).val().pincode;
          let areaCode = snap.child(phone).val().areaCode;
          let name = snap.child(phone).val().name;

          //!---------------------
          //! get current pincode of that user from databasse
          let currentPin = snap
            .child(userData.sender.phone)
            .child('pincode')
            .val();

          //! get current data of phoneNo of admin user from databasse
          let pincode_AdminNumbers = snap
            .child('MyData')
            .child('PincodeWithAdminNo')
            .val();

          let productref = snap
            .child(phone)
            .child('History')
            .child(mainTimestamp)
            .child('Product')
            .val();

          let adminNo = getAdminPhone(pincode_AdminNumbers, currentPin);

          let product = getAllOrderedItems(productref, foodItems);
          let tempArray = product.split('  |  ');
          let finalOrderDetails = tempArray.join('\n');

          let message = `New order has been placed.\n\n${phone}\n${name}\n\n${finalOrderDetails}`;

          sendMsgFromBot(adminNo, message);

          // delte the Product idFOr CUt
          database
            .ref('chatbot')
            .child(phone)
            .child('History')
            .child(mainTimestamp)
            .child('ProductIdForCut')
            .remove();
          res.send(
            'Thanks for ordering with us. We will soon update you with the status.'
          );

          database
            .ref(`chatbot`)
            .child(phone)
            .child('History')
            .child(mainTimestamp)
            .child('Messages')
            .child(time)
            .set(inputdata);

          database
            .ref('chatbot')
            .child(phone)
            .child('History')
            .child(mainTimestamp)
            .child('count')
            .set(6);

          saveData(
            mainTimestamp,
            phone,
            name,
            product,
            address,
            pincode,
            areaCode
          );
        }
      } else {
        var todayDateTime = new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
        });
        time = todayDateTime.split(' ')[1];
        date = todayDateTime.split(' ')[0];
        date = date.split('/');
        date = `${date[0]},${date[1]},${date[2]}`;
        date = date.slice(0, -1);
        timestamp = date + '|' + time;
        database.ref(`chatbot/${userData.sender.phone}`).set({
          name: userData.sender.name,
          phone: userData.sender.phone,
          timestamp: timestamp,
        });
        database
          .ref(`chatbot/${userData.sender.phone}`)
          .child('History')
          .child(timestamp)
          .child('Messages')
          .child(time)
          .set(inputdata);
        database
          .ref(`chatbot/${userData.sender.phone}`)
          .child('History')
          .child(timestamp)
          .child('count')
          .set(1);
        res.send(
          `Hello ${userData.sender.name},\nPlease provide the PIN Code.`
        );
      }
    });

    function saveData(
      timestamp,
      phone,
      name,
      product,
      address,
      pincode,
      areaCode
    ) {
      let date = timestamp.split('|');
      let orderDate = `${date[0]} , ${date[1]}`;
      // let customerName, customerPhone, product, pincode, address, areaCode;
      let saveDataArray = [
        orderDate,
        phone,
        name,
        product,
        address,
        pincode,
        areaCode,
        'New',
      ];
      second();

      function second() {
        const client = new google.auth.JWT(
          keys.client_email,
          null,
          keys.private_key,
          ['https://www.googleapis.com/auth/spreadsheets']
        );

        client.authorize((err, tokens) => {
          if (err) {
            return;
          } else {
            gsrun(client);
          }
        });
        var gsrun = async (cl) => {
          const gsapi = google.sheets({
            version: 'v4',
            auth: cl,
          });

          const options = {
            spreadsheetId: '1E8ZYti2gunPZkybHtlBElEW4rFITwmXRz3Pbn3dLbEo',
            range: 'Sheet1!A1:H1000',
          };

          let data = await gsapi.spreadsheets.values.get(options);
          let oldUserLogs = data.data.values;
          oldUserLogs.push(saveDataArray);

          const update = {
            spreadsheetId: '1E8ZYti2gunPZkybHtlBElEW4rFITwmXRz3Pbn3dLbEo',
            range: 'Sheet1!A1:H1000',
            valueInputOption: 'USER_ENTERED',
            resource: { values: oldUserLogs },
          };

          let res = await gsapi.spreadsheets.values.update(update);
        };
      }
    }
  }
});
//! :😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃

// exports.scheduledFunction = functions.pubsub
//   .schedule('*/10 * * * *')
//   .onRun((context) => {
//     console.log('This will be run every 15 minutes!', context);

//     const sendMsgFromBot = (number, msg) => {
//       //! change {source,botName,apiKey } according to bot
//       const checkNo = (phoneNumber) => {
//         if (phoneNumber.toString().slice(0, 2) == 91) {
//           return phoneNumber;
//         } else {
//           return `91${phoneNumber}`;
//         }
//       };
//       let newNumber = checkNo(number);
//       console.log('infunc No', newNumber);
//       let destination = newNumber;

//       // ! ProductionBot
//       // ?---------------------------------------------------------------
//       var source = '917795662042';
//       let botName = 'Meatable';
//       let apiKey = 'xbfjxahyq0k6xe1gtvahda9rygomfhpo';
//       // ?---------------------------------------------------------------

//       var config = {
//         method: 'post',
//         url: `https://api.gupshup.io/sm/api/v1/msg?channel=whatsapp&source=${source}&destination=${destination}&message=${msg}&src.name=${botName}`,
//         headers: {
//           'Cache-Control': 'no-cache',
//           'Content-Type': 'application/x-www-form-urlencoded',
//           apikey: apiKey,
//           'cache-control': 'no-cache',
//         },
//       };
//       axios(config)
//         .then(function (response) {
//           console.log(JSON.stringify(response.data));
//         })
//         .catch(function (error) {
//           console.log(error);
//         });
//     };

//     const client = new google.auth.JWT(
//       keys.client_email,
//       null,
//       keys.private_key,
//       ['https://www.googleapis.com/auth/spreadsheets']
//     );

//     client.authorize((err, tokens) => {
//       if (err) {
//         return;
//       } else {
//         myFunc(client);
//       }
//     });

//     const myFunc = async (cl) => {
//       const gsapi = google.sheets({
//         version: 'v4',
//         auth: cl,
//       });

//       //? your excel sheet Details
//       let ordersheet = {
//         spreadsheetId: '1E8ZYti2gunPZkybHtlBElEW4rFITwmXRz3Pbn3dLbEo', // pincode and address sheet
//         range: 'Sheet1!A1:I1000',
//       };

//       let allorders = await gsapi.spreadsheets.values.get(ordersheet);
//       ordersheet = allorders.data.values;

//       // ? perform all operations you want here only!
//       ordersheet.map((row) => {
//         if ((row[7] == 'processing' || row[7] == 'Processing') && row[8]) {
//           /*  ---------
//       ? Variables
//     ----------*/
//           let name, phone, product, amount;
//           name = row[2];
//           phone = row[1];
//           product = row[3];
//           amount = row[8];
//           let msg = `Your order is now being processed.\n Your total cost will be Rs.${amount}`;
//           // =-----------------------

//           console.log(
//             `\nname: ${name}\nphone: ${phone}\nproduct: ${product}\n`
//           );

//           sendMsgFromBot(phone, msg);
//           return (row[7] = 'processed');
//         } else {
//           return row;
//         }
//       });
//       // =------------------------------------------------------------------------------------------

//       const update = {
//         spreadsheetId: '1E8ZYti2gunPZkybHtlBElEW4rFITwmXRz3Pbn3dLbEo',
//         range: 'Sheet1!A1:I1000',
//         valueInputOption: 'USER_ENTERED',
//         resource: { values: ordersheet },
//       };

//       let res = await gsapi.spreadsheets.values.update(update);
//       console.log(res);
//       return ordersheet;
//     };

//     return null;
//   });
