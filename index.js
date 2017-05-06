var express = require('express');
var app = express();
var router = express.Router();
var bodyParser = require('body-parser');
var mailController = require('./controllers/mail_controller');

var port = 8086;
{
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())
    app.use('/api', router);
}

router.post('/send_mail', mailController.sendMailToSpecifiedUser);

app.listen(port);
