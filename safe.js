// if (req.method == 'POST') {

//   var cval;

// database
//  .ref('chatbot')
//  .child(`${userData.sender.phone.toString()}`)
//  .on('value', (snapshot) => {
//    cval = snapshot.val().count;
//  });
// if (startConvo.includes(data.text)) {
//  database.ref(`chatbot/${userData.sender.phone}`).set({
//    count: 1,
//    name: `${userData.sender.name}`,
//    phone: `${userData.sender.phone}`,
//  });
//  res.send(`Hello ${userData.sender.name},\nPlease provide the PIN Code.`);
// }

// setTimeout(() => {
//  if (inputdata.length > 7 && cval == 6) {
//    database
//      .ref('chatbot')
//      .child(userData.sender.phone)
//      .child('Address')
//      .set(inputdata);
//    database
//      .ref('chatbot')
//      .child(userData.sender.phone)
//      .child('count')
//      .set(7);
//    saveData(userData.sender.phone);
//    res.send('Thanks for contacting us.');
//  }
//  if (cval == 5) {
//    database
//      .ref('chatbot')
//      .child(userData.sender.phone)
//      .child('count')
//      .set(6);

//    database
//      .ref('chatbot')
//      .child(userData.sender.phone)
//      .child('CuttingStyle')
//      .set(inputdata);
//    res.send(res.send(`Thanks,Please let us know your address`));
//  }
//  if (cval == 4) {
//    var productArr = inputdata.split(' ');
//    var currentProduct = getImageandDish(productArr[0]);
//    console.log('in cval if', currentProduct);
//    if (currentProduct != null) {
//      setTimeout(() => {
//        console.log(currentProduct);
//        database
//          .ref('chatbot')
//          .child(userData.sender.phone)
//          .child('count')
//          .set(5);
//        database
//          .ref('chatbot')
//          .child(userData.sender.phone)
//          .child('ProductId')
//          .set(productArr[0]);
//        database
//          .ref('chatbot')
//          .child(userData.sender.phone)
//          .child('ProductQuantity')
//          .set(productArr[1]);
//        console.log('link is ', currentProduct[2]);

//        res.send(
//          'How would you like the cut for' + currentProduct[1] + '?'
//        );
//      }, 3000);
//    } else {
//      res.send('check the error');
//    }
//  }
//  if (cval == 3) {
//    database
//      .ref('chatbot')
//      .child(userData.sender.phone)
//      .child('count')
//      .set(4);
//    database
//      .ref('chatbot')
//      .child(userData.sender.phone)
//      .child('areaCode')
//      .set(inputdata);
//    res.send(menuCard);
//  }
//  if (inputdata.length === 6 && cval == 1) {
//    var cityPoints = checkPin(inputdata);

//    if (cityPoints != 'NotFound') {
//      res.send(
//        `We serve the following areas,\n ${cityPoints.toString()},\n please choose an area.`
//      );
//      database
//        .ref('chatbot')
//        .child(userData.sender.phone)
//        .child('pincode')
//        .set(inputdata);
//      database
//        .ref('chatbot')
//        .child(userData.sender.phone)
//        .child('count')
//        .set(3);
//    } else {
//      res.send('We dont provide out services to this address');
//    }
//  }
// }, 2000);

// async function saveData(phoneNo) {
//  var today = new Date();
//  var date =
//    today.getFullYear() +
//    '-' +
//    (today.getMonth() + 1) +
//    '-' +
//    today.getDate();
//  var time =
//    today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
//  var orderDate = date + ' ' + time;

//  let customerName,
//    customerPhone,
//    productID,
//    productQuantity,
//    pincode,
//    address,
//    areaCode,
//    cuttingStyle;
//  let saveDataArray = [];

//  function first(callback) {
//    database
//      .ref('chatbot')
//      .child(phoneNo)
//      .on('value', (snapshot) => {
//        customerName = snapshot.val().name;
//        customerPhone = snapshot.val().phone;
//        productID = snapshot.val().ProductId;
//        productQuantity = snapshot.val().ProductQuantity;
//        pincode = snapshot.val().pincode;
//        address = snapshot.val().Address;
//        areaCode = snapshot.val().areaCode;
//        cuttingStyle = snapshot.val().CuttingStyle;
//      });
//    let product = productID + ' | ' + productQuantity;
//    saveDataArray = [
//      customerPhone,
//      orderDate,
//      customerName,
//      product,
//      cuttingStyle,
//      address,
//      pincode,
//      areaCode,
//      'New',
//    ];
//    callback();
//  }

//  function second() {
//    const client = new google.auth.JWT(
//      keys.client_email,
//      null,
//      keys.private_key,
//      ['https://www.googleapis.com/auth/spreadsheets']
//    );

//    client.authorize((err, tokens) => {
//      if (err) {
//        console.log(err);
//        return; // just get out from the function
//      } else {
//        console.log('Connected');
//        gsrun(client);
//      }
//    });
//    var gsrun = async (cl) => {
//      const gsapi = google.sheets({
//        version: 'v4',
//        auth: cl,
//      });

//      const options = {
//        spreadsheetId: '1E8ZYti2gunPZkybHtlBElEW4rFITwmXRz3Pbn3dLbEo',
//        range: 'Sheet1!A1:I100',
//      };

//      let data = await gsapi.spreadsheets.values.get(options);
//      let oldUserLogs = data.data.values;
//      oldUserLogs.push(saveDataArray);

//      const update = {
//        spreadsheetId: '1E8ZYti2gunPZkybHtlBElEW4rFITwmXRz3Pbn3dLbEo',
//        range: 'Sheet1!A1:I100',
//        valueInputOption: 'USER_ENTERED',
//        resource: { values: oldUserLogs },
//      };

//      let res = await gsapi.spreadsheets.values.update(update);
//      console.log(res);
//    };
//  }

//  first(second);
// }
// }

// ---

// var productArr = inputdata.split(' ');
// var currentProduct = getImageandDish(productArr[0]);
// if (currentProduct != null) {
//   database
//     .ref(`chatbot`)
//     .child(phone)
//     .child('History')
//     .child(mainTimestamp)
//     .child('Messages')
//     .child(time)
//     .set(inputdata);

//   database
//     .ref('chatbot')
//     .child(phone)
//     .child('History')
//     .child(mainTimestamp)
//     .child('count')
//     .set(4);

//   database
//     .ref('chatbot')
//     .child(userData.sender.phone)
//     .child('History')
//     .child(mainTimestamp)
//     .child('ProductId')
//     .set(productArr[0]);

//   database
//     .ref('chatbot')
//     .child(userData.sender.phone)
//     .child('History')
//     .child(mainTimestamp)
//     .child('ProductQuantity')
//     .set(productArr[1]);

//   console.log('link is ', currentProduct[2]);

//   res.send(
//     'How would you like the cut for ' + currentProduct[1] + '?'
//   );
// } else {
//   res.send('check the error');
// }
