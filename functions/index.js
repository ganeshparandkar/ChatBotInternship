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
var sheetData = [];
var sheetProducts = [];
const client = new google.auth.JWT(keys.client_email, null, keys.private_key, [
  'https://www.googleapis.com/auth/spreadsheets',
]);

client.authorize((err, tokens) => {
  if (err) {
    console.log(err);
    return; // just get out from the function
  } else {
    // console.log('Connected');
    gsrun(client).then((data) => {
      sheetData = data[0];
      sheetProducts = data[1];
      // console.log(sheetData, '\n', sheetProducts);
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

  const options = {
    spreadsheetId: '1PorRlxlCbXveAtXBicBGfn6UFGVt9VZ5hqDtyBzOW9Q', // pincode and address sheet
    range: 'Sheet1!A1:B100',
  };

  const productSheet = {
    spreadsheetId: '1kK2_2s3kwhAzK2LrwFfOFXZWl45WD-wr0fSgOpqrgDw', // pincode and address sheet
    range: 'Sheet1!A1:C100',
  };

  let data = await gsapi.spreadsheets.values.get(options);
  let dataArray = data.data.values;

  let products = await gsapi.spreadsheets.values.get(productSheet);
  let productArr = products.data.values;

  let sheets = [dataArray, productArr];

  return sheets;
};

admin.initializeApp({
  databaseURL: 'https://ct-chat-bot-2021-default-rtdb.firebaseio.com',
});
var database = admin.database();

exports.apicall = functions.https.onRequest((req, res) => {
  function checkPin(inputpin) {
    let pincodeslocal = [];
    sheetData.map((e) => {
      pincodeslocal.push(e[0]);
    });
    // console.log(pincodeslocal);
    if (pincodeslocal.includes(inputpin.toString())) {
      let placesAtPincode = '';
      let index = pincodeslocal.indexOf(inputpin.toString());
      placesAtPincode = sheetData[[index]][1];
      // console.log('index is ', index);
      // console.log('infunction ', placesAtPincode);
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

  const menuCard = [
    {
      type: 'image',
      originalUrl:
        'https://image.freepik.com/free-vector/vector-cartoon-illustration-design-fast-food-restaurant-menu_1441-334.jpg',
      previewUrl:
        'https://image.freepik.com/free-vector/vector-cartoon-illustration-design-fast-food-restaurant-menu_1441-334.jpg',
      caption: 'Sample image',
    },
    'Please enter ItemId and quantity',
  ];

  if (req.method == 'POST') {
    if (inputdata == 'cls') {
      database.ref('chatbot').child(userData.sender.phone.toString()).remove();
    }
    var date, time, timestamp;

    database.ref('chatbot').once('value', (snap) => {
      let phone = userData.sender.phone.toString();

      if (snap.hasChild(phone)) {
        let mainTimestamp = snap.child(phone).val().timestamp;
        let count = snap
          .child(phone)
          .child('History')
          .child(mainTimestamp)
          .val().count;

        // console.log(`count = ${count}, timestamp = ${mainTimestamp}`);

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
          let productref = snap
            .child(phone)
            .child('History')
            .child(mainTimestamp)
            .child('Product')
            .val();

          let keys = Object.keys(productref);
          let AllProducts = [];
          for (let i = 0; i < keys.length; i++) {
            let itemArr = getImageandDish(Number(keys[i]));

            let pName = itemArr[1];
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
              let itemArr = getImageandDish(Number(keys[i]));

              let pName = itemArr[1];
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

          if (cityPoints != 'NotFound') {
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
              `We serve the following areas,\n ${cityPoints.toString()},\n please choose an area.`
            );
          } else {
            res.send('We dont provide out services to this address');
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
        }
        if (count == 3) {
          let data = inputdata.toUpperCase();
          if (data != 'X') {
            var productArr = inputdata.split(' ');
            console.log('productArr = ', productArr);
            if (productArr.length >= 1) {
              try {
                var currentProduct = getImageandDish(productArr[0]);
              } catch (error) {
                res.send(
                  'We Dont Have That Product Please Check Again and Order another product!'
                );
              }
              console.log('currentProduct = ', currentProduct);
              if (currentProduct) {
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
                  .child(productArr[0])
                  .set({
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
            } else {
              res.send('Please Enter Valid Input');
            }
          } else {
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
            let keysarr = Object.keys(arr);
            let pId = keysarr[0];
            pId = Number(pId);
            let productarr = getImageandDish(pId);

            database
              .ref('chatbot')
              .child(phone)
              .child('History')
              .child(mainTimestamp)
              .child('ProductIdForCut')
              .set(pId);
            res.send(`How would you like the cut for ${productarr[1]} ?`);
          }
        }

        if (count == 4) {
          cutval = snap.child(phone).child('History').child(mainTimestamp).val()
            .ProductIdForCut;

          var a = snap.child(phone).child('History').child(mainTimestamp).val();
          let arr = a.Product;

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
                var productarr = getImageandDish(keysarr[i]);
                pName = productarr[1];

                database
                  .ref('chatbot')
                  .child(phone)
                  .child('History')
                  .child(mainTimestamp)
                  .child('ProductIdForCut')
                  .set(keysarr[i]);
                res.send(`How would you like the cut for ${pName} ?`);
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
            let itemArr = getImageandDish(Number(keys[i]));

            let pName = itemArr[1];
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
      console.log(saveDataArray);
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
            console.log(err);
            return;
          } else {
            console.log('Connected');
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
          console.log('res', res);
        };
      }
    }
  }
});
