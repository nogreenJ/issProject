const express = require('express')
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser')
var soap = require('soap');
var url = 'https://www.n2yo.com/sat/satws.php/GetGeoIp/GetSatelliteName/GetSatelliteName?wsdl';
var parseString = require('xml2js').parseString;

router.use(express.static(path.join(__dirname, 'public')));
router.use(bodyParser.json());

router.get('/', function (req, res) {
    soap.createClient(url, function (err, client) {
        if (err) {
            res.status(400).send(err);
        }
        client.GetVisiblePasses(
            {
                id: {
                    attributes: {
                        'xsi:type': 'xsd:int'
                    },
                    $value: 25544
                },
                lat: {
                    attributes: {
                        'xsi:type': 'xsd:double'
                    },
                    $value: '-28,262350'
                },
                lng: {
                    attributes: {
                        'xsi:type': 'xsd:double'
                    },
                    $value: '-52,408989'
                },
                alt: {
                    attributes: {
                        'xsi:type': 'xsd:double'
                    },
                    $value: 687
                },
                days: {
                    attributes: {
                        'xsi:type': 'xsd:int'
                    },
                    $value: 10
                },
                minduration: {
                    attributes: {
                        'xsi:type': 'xsd:int'
                    },
                    $value: 0
                },
                minelevation: {
                    attributes: {
                        'xsi:type': 'xsd:int'
                    },
                    $value: 0
                },
                license: {
                    attributes: {
                        'xsi:type': 'xsd:string'
                    },
                    $value: process.env.N2YO_KEY
                }
            },
            function (err, result, xml) {
                if (err) {
                    res.status(400).send(err);
                } else if (result) {
                    res.status(200).send(parseResultToResponse(result));
                } else {
                    parseString(xml, function (err, result) {
                        res.status(200).send(result);
                    });
                }
            });
    });
})

const parseResultToResponse = (result) => {
    let response = []

    passes = result['return']['item']

    for (var i = 0; i < passes.length; i++) {
        var pass = { posIni: {}, posMax: {}, posFim: {} }
        pass.data = parseData(passes[i]['startUTC']['$value'])
        pass.duration = parseDuration(passes[i]['duration']['$value'])
        pass.magnitude = passes[i]['mag']['$value']

        pass.horaIni = parseTime(passes[i]['startUTC']['$value'])
        pass.posIni.azimuth = passes[i]['startAz']['$value']
        pass.posIni.elevation = passes[i]['startEl']['$value']
        pass.posIni.cardinalidade = passes[i]['startAzCompass']['$value']

        pass.horaMax = parseTime(passes[i]['maxUTC']['$value'])
        pass.posMax.azimuth = passes[i]['maxAz']['$value']
        pass.posMax.elevation = passes[i]['maxEl']['$value']
        pass.posMax.cardinalidade = passes[i]['maxAzCompass']['$value']

        pass.horaFim = parseTime(passes[i]['endUTC']['$value'])
        pass.posFim.azimuth = passes[i]['endAz']['$value']
        pass.posFim.elevation = passes[i]['endEl']['$value']
        pass.posFim.cardinalidade = passes[i]['endAzCompass']['$value']
        response.push(pass);
    }

    return response;
}

const parseData = function (utc) {
    return new Date(utc * 1000).toLocaleDateString('pt-BR', { timeZone: "Brazil/East" });
}

const parseTime = function (utc) {
    return new Date(utc * 1000).toLocaleTimeString('pt-BR', { timeZone: "Brazil/East" });
}

const parseDuration = function (duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration - minutes * 60;
    return minutes + ' minutos e ' + seconds + ' segundos'
}

module.exports = router;
