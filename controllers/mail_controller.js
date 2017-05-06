var nodemailer = require('nodemailer');

module.exports.sendMailToSpecifiedUser = function(req, res) {
    let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
            user: 'ziprecruiter784@gmail.com',
            pass: 'ninja_droid123'
        }
    });
    let mailOptions = {
        from: 'Ninja', 
        to: req.body.mail_id, 
        subject: 'Referral', 
        text: 'Hello, you have been referred!!!', 
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
        res.json({"status": "email sent"});
    });
};