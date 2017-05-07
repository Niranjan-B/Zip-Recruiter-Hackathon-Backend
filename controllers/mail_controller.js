var nodemailer = require('nodemailer');
var Mailgen = require('mailgen');

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
        html: '<b>Hello world ?</b>', 
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
        res.json({"status": "email sent"});
    });
};


module.exports.sendMail = function(referenceEmail, cb) {
    var recruiterName = 'Ann Meera'
    var candidateName = 'Niranjan Bhaskar'
    var companyName = 'Cisco Systems'
    var referralName = 'Pavan Kumar Gondhi'
    var mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        // Appears in header & footer of e-mails 
        name: 'Zip Recruiter',
        link: 'https://www.ziprecruiter.com'
        // Optional product logo 
        // logo: 'https://mailgen.js/img/logo.png' 
    }

    });

var email = {
    body: {
        name: referralName,
        intro: 'My Name is '+recruiterName+' and I am the HR for '+companyName+'. This is regarding a reference check on your former employee '+candidateName+' Could you please provide your available time slot where we can schedule a 15 min phone interview',
        action: {
            instructions: 'To schedule a time slot, please click here:',
            button: {
                color: '#22BC66', // Optional action button color 
                text: 'Select your Choice',
                link: 'http://localhost:8082/SelectTimeSlot?hr_email=ziprecruiter784@gmail.com&&referral_email='+referenceEmail
            }
        },
        outro: 'Appreciate your time. Thank You.'
    }
};
 
// Generate an HTML email with the provided contents 
var emailBody = mailGenerator.generate(email);
 
// Generate the plaintext version of the e-mail (for clients that do not support HTML) 
var emailText = mailGenerator.generatePlaintext(email);
 
// Optionally, preview the generated HTML e-mail by writing it to a local file 
require('fs').writeFileSync('preview.html', emailBody, 'utf8');
 
// `emailBody` now contains the HTML body, 
// and `emailText` contains the textual version. 
//  
// It's up to you to send the e-mail. 
// Check out nodemailer to accomplish this: 
// https://nodemailer.com/ 
    let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
            user: 'ziprecruiter784@gmail.com',
            pass: 'ninja_droid123'
        }
    });
    let mailOptions = {
        from: recruiterName, 
        to: referenceEmail, 
        subject: 'Request for Phone Appointment for Reference check of '+candidateName, 
        html: emailBody, 
        text: emailText,
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            cb(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
        cb();
    });


};



