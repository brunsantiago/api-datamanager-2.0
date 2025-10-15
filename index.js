//import app from "./src/app.js";
const app = require('./src/app.js');
//import { PORT } from "./src/config.js";
const PORT = require('./src/config.js').PORT;
//import { PORT_HTTPS } from "./config.js";

//HTTP CONFIG

app.listen(PORT);
console.log(`Server on port https://app-server.com.ar: ${PORT}`);


//HTTPS CONFIG

// import fs from 'fs';
// import https from 'https';
//
// const https_options = {
//  ca: fs.readFileSync("certificate-ca.crt"),
//  key: fs.readFileSync("private.key"),
//  cert: fs.readFileSync("certificate.crt")
// };
//
// https.createServer(https_options,app).listen(PORT_HTTPS, function(){
// 	console.log('Servidor https corriendo en el puerto: '+ PORT_HTTPS);
// });
