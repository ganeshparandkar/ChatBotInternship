/* -----
Declaration Part
-------*/
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const keys = require('./key.json');
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

client.authorize((err, tokens) => {
  if (err) {
    return; // just get out from the function
  } else {
    gsrun(client).then((data) => {
      sheetData = data[0];
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
    range: 'Sheet1!A1:B100',
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
  function checkPin(inputpin) {
    let pincodeslocal = [];
    sheetData.map((e) => {
      pincodeslocal.push(e[0]);
    });
    if (pincodeslocal.includes(inputpin.toString())) {
      let placesAtPincode = '';
      let index = pincodeslocal.indexOf(inputpin.toString());
      placesAtPincode = sheetData[[index]][1];
      return placesAtPincode;
    } else {
      return 'NotFound';
    }
  }

  function getImageandDish(id) {
    id = id.toString();
    let dish, url, arr;

    for (let i = 0; i <= sheetProducts.length; i++) {
      if (sheetProducts[i][0] == id) {
        dish = sheetProducts[i][1];

        url = sheetProducts[i][2];
        arr = [id, dish, url];
        return arr;
      }
    }
    return null;
  }

  const data = req.body.payload.payload;
  const userData = req.body.payload;
  const inputdata = data.text;
  // const resetMessages = ['hi', 'hii', 'hie', 'cls', 'Cls', 'Hi', 'Hii'];
  const menuCard = [
    {
      type: 'image',
      originalUrl: `https://firebasestorage.googleapis.com/v0/b/ct-chat-bot-2021.appspot.com/o/Meatable%20Menu.jpg?alt=media&token=21b6db5c-604b-4185-b51e-0463d970b9bf`,
      previewUrl: `https://firebasestorage.googleapis.com/v0/b/ct-chat-bot-2021.appspot.com/o/Meatable%20Menu.jpg?alt=media&token=21b6db5c-604b-4185-b51e-0463d970b9bf`,
      caption: 'Menu Card',
    },
    'Please enter ItemId and quantity',
  ];
  // const menuCard = [
  //   {
  //     type: 'image',
  //     originalUrl: 'https://i.ibb.co/Z6P26fW/Meatable-Menu.jpg',
  //     previewUrl: 'https://i.ibb.co/Z6P26fW/Meatable-Menu.jpg',
  //     caption: 'Menu Card',
  //   },
  //   'Please enter ItemId and quantity',
  // ];
  // const menuCard = [
  //   {
  //     type: 'image',
  //     originalUrl:
  //       'https://image.freepik.com/free-vector/vector-cartoon-illustration-design-fast-food-restaurant-menu_1441-334.jpg',
  //     previewUrl:
  //       'https://image.freepik.com/free-vector/vector-cartoon-illustration-design-fast-food-restaurant-menu_1441-334.jpg',
  //     caption: 'Sample image',
  //   },
  //   'Please enter ItemId and quantity',
  // ];

  if (req.method == 'POST') {
    if (inputdata.toLowerCase() == 'cls') {
      database.ref('chatbot').child(userData.sender.phone.toString()).remove();
    }
    var date, time, timestamp, phone;

    database.ref('chatbot').once('value', (snap) => {
      phone = userData.sender.phone.toString();
      // let mT = snap.child(phone).val().timestamp;
      // let myCount = snap.child(phone).child('History').child(mT).val().count;

      // if (resetMessages.includes(inputdata) && myCount != 6) {
      //   database
      //     .ref('chatbot')
      //     .child(userData.sender.phone.toString())
      //     .remove();
      // }

      if (snap.hasChild(phone)) {
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

          let keys = Object.keys(productref);
          let AllProducts = [];
          for (let i = 0; i < keys.length; i++) {
            // let itemArr = getImageandDish(Number(keys[i]));

            // let pName = itemArr[1];
            let pName = foodItems[keys[i] - 1];
            AllProducts.push(
              `${pName},${productref[keys[i]].Quantity},${
                productref[keys[i]].slices
              }`
            );
          }
          let singleLineProducts = AllProducts.join(`  |  `);
          database
            .ref(`chatbot`)
            .child(phone)
            .child('History')
            .child(mainTimestamp)
            .child('ProductDetails')
            .set(singleLineProducts);

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
            `Your last order was\n\n${singleLineProducts}\n\nPress 1 for re-order.
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

            let keys = Object.keys(productref);
            let AllProducts = [];
            for (let i = 0; i < keys.length; i++) {
              // let itemArr = getImageandDish(Number(keys[i]));

              // let pName = itemArr[1];
              let pName = foodItems[keys[i]];
              AllProducts.push(
                `${pName},${productref[keys[i]].Quantity},${
                  productref[keys[i]].slices
                }`
              );
            }
            let product = AllProducts.join(`  |  `);
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
          } else {
            res.send('please enter valid Input!');
          }
        }

        if (count == 1) {
          var cityPoints = checkPin(inputdata);

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
              },\n please choose an area.`
            );
          } else {
            res.send(
              'We dont provide out services to this address.\n please try different pin.'
            );
          }

          // if (cityPoints != 'NotFound') {
          // database
          //   .ref('chatbot')
          //   .child(userData.sender.phone)
          //   .child('pincode')
          //   .set(inputdata);
          // database
          //   .ref('chatbot')
          //   .child(phone)
          //   .child('History')
          //   .child(mainTimestamp)
          //   .child('count')
          //   .set(2);
          // database
          //   .ref(`chatbot`)
          //   .child(phone)
          //   .child('History')
          //   .child(mainTimestamp)
          //   .child('Messages')
          //   .child(time)
          //   .set(inputdata);
          // res.send(
          //   `We serve the following areas,\n ${cityPoints.toString()},\n please choose an area.`
          // );
          // } else {
          // res.send('We dont provide out services to this address');
          // }
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
            //here you will terminate the loop Input is X

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
            let arr = a.Product;
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
            // res.send(`How would you like the cut for ${productarr[1]} ?`);
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

            res.send('Please enter your address');
            database
              .ref('chatbot')
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('count')
              .set(5);
          }
        }
        if (count == 5) {
          let foodItems = snap.child('MyData').child('foodItem').val();

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
            .child(userData.sender.phone)
            .child('Address')
            .set(inputdata);

          database
            .ref('chatbot')
            .child(phone)
            .child('History')
            .child(mainTimestamp)
            .child('count')
            .set(6);
          //!---------------------
          let name = snap.child(phone).val().name;
          let address = inputdata;
          let pincode = snap.child(phone).val().pincode;
          let areaCode = snap.child(phone).val().areaCode;
          let productref = snap
            .child(phone)
            .child('History')
            .child(mainTimestamp)
            .child('Product')
            .val();

          let keys = Object.keys(productref);
          let AllProducts = [];
          for (let i = 0; i < keys.length; i++) {
            // let itemArr = getImageandDish(Number(keys[i]));
            // let pName = itemArr[1];
            let pName = foodItems[keys[i] - 1];
            AllProducts.push(
              `${pName},${productref[keys[i]].Quantity},${
                productref[keys[i]].slices
              }`
            );
          }
          let product = AllProducts.join(`  |  `);
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
