require('dotenv').config()

const schedule = require('node-schedule');
var nodemailer = require('nodemailer');
const _ = require('lodash');
const express = require('express')
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser')

router.use(express.static(path.join(__dirname, 'public')));
router.use(bodyParser.json());

var mailOptions = {
    from: process.env.EMAIL_REMINDER,
    to: 'joaoldp135@gmail.com',
    subject: 'Lembrete de ver a ISS hoje!',
    text: 'teste'
};

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_REMINDER,
        pass: process.env.EMAIL_REMINDER_SENHA,
        type: 'OAuth2',
        clientId: process.env.OAUTH_CLIENTID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN
    }
});

router.get('/', function (req, res) {
    const data = req.query.data;
    const email = req.query.email;
    if (!email) {
        console.log('Limpando jobs atuais...')
        const jobNames = _.keys(schedule.scheduledJobs);
        for (let name of jobNames) schedule.cancelJob(name);
    } else if (!data) {
        console.log('JOBS ATUAIS: ' + _.keys(schedule.scheduledJobs));
        console.log('Enviando email para ' + email + ' daqui 30 segundos...')
        const date = new Date(new Date().getTime() + 30000);

        mailOptions.subject = 'Email de teste!';
        mailOptions.text = 'Email de teste!';

        schedule.scheduleJob(date, function () {
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email de teste enviado para ' + email + ': ' + info.response);
                }
            });
        });
    } else {
        console.log('Criando lembrete para enviar para ' + email + ' em ' + data + '...')

        //Cria lembrete na hora inicial
        let d = data.split('/');
        const date = new Date(d[1] + '/' + d[0] + '/' + d[2]);

        mailOptions.to = email;
        mailOptions.text = 'A ISS está visível agora!';
        schedule.scheduleJob(date, function () {
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email do momento enviado para ' + email + ': ' + info.response);
                }
            });
        });

        //Cria lembrete na hora final
        mailOptions.text = 'A ISS estará visível hoje a partir das ' + date.getUTCHours() + ":" + date.getUTCMinutes();
        date.setHours(0, 0, 0, 0);

        schedule.scheduleJob(date, function () {
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email do dia enviado para ' + email + ': ' + info.response);
                }
            });
        });
    }

    res.status(200).send();
})

module.exports = router;