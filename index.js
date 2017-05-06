var express = require('express');
var app = express();
var router = express.Router();
var bodyParser = require('body-parser');

var port = 8086;
{
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())
    app.use('/api', router);
}

router.get('/test', function(req, res) {
    res.json("Hello world");
});

app.listen(port);
