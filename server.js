const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5501;

app.use(cors());
app.use(bodyParser.json());

app.post('/send-email', (req, res) => {
    const { name, email, message } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail', // or your email service
        auth: {
            user: 'codersingh94@gmail.com', // Replace with your email
            pass: '@coder$$049', // Replace with your app password
        },
    });

    const mailOptions = {
        from: 'your_email@gmail.com',
        to: 'codersingh94@gmail.com',
        subject: 'Contact Form Submission',
        text: `
            Name: ${name}
            Email: ${email}
            Message: ${message}
        `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error sending email');
        } else {
            console.log('Email sent: ' + info.response);
            res.send('Email sent successfully');
        }
    });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});