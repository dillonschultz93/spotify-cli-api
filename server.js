const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Setting up the express server
const app = express();
app.use(express.static(__dirname + '/public')).use(cors()).use(cookieParser());
app.use(require('./routes/routes.js'));

console.log('Listening on Port 8888');
app.listen(8888);
