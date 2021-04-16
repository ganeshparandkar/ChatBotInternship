// const sendMsgFromBot = (number, msg) => {
//     //! change {source,botName,apiKey } according to bot
//     const checkNo = (phoneNumber) => {
//       if (phoneNumber.toString().slice(0, 2) == 91) {
//         return phoneNumber;
//       } else {
//         return `91${phoneNumber}`;
//       }
//     };
//     let newNumber = checkNo(number);
//     console.log('infunc No', newNumber);
//     let destination = newNumber;

//     // ! trialBot
//     // ?---------------------------------------------------------------
//     // var source = '917834811114';
//     // let botName = 'TestShriyashApi';
//     // let apiKey = 'ng9x1glfai42vpvv7rrpvtefe2l8jleg';
//     // ?---------------------------------------------------------------
//     // ! ProductionBot
//     // ?---------------------------------------------------------------
//     var source = '917795662042';
//     let botName = 'Meatable';
//     let apiKey = 'xbfjxahyq0k6xe1gtvahda9rygomfhpo';
//     // ?---------------------------------------------------------------

//     var config = {
//       method: 'post',
//       url: `https://api.gupshup.io/sm/api/v1/msg?channel=whatsapp&source=${source}&destination=${destination}&message=${msg}&src.name=${botName}`,
//       headers: {
//         'Cache-Control': 'no-cache',
//         'Content-Type': 'application/x-www-form-urlencoded',
//         apikey: apiKey,
//         'cache-control': 'no-cache',
//       },
//     };
//     axios(config)
//       .then(function (response) {
//         console.log(JSON.stringify(response.data));
//       })
//       .catch(function (error) {
//         console.log(error);
//       });
//   };

// ?===========================================================================
//! 😄 this will return the product quantity in proper manner
let iString = `c5 2 kg`;
let niString = iString.split(' ');
let a = niString.splice(1);
let p = a.join('');
console.log(p);
