const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const PromisePool = require('@supercharge/promise-pool')
const Bottleneck = require("bottleneck/es5");

const db = require('./database');
const { verify } = require('crypto');
const { resolve } = require('path');
const fetch = require('node-fetch');


// If modifying these scopes, delete token.json.
const SCOPES = ['https://mail.google.com/'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
const REG_ZALANDO = /\>(NL[A-Z|0-9]{8})\</;
const REG_SNIPES = /href="(https?:\/\/(.+?\.)?link\.mail\.snipes\.com(\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=\%]*)?)/;



module.exports = {
    
    harvestCouponsZalando: function(resolve) {
        fs.readFile('./json/credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);

            // Authorize a client with credentials, then call the Gmail API.

            authorize(JSON.parse(content), this.harvestCouponsZalandoAsync, resolve)
        });
    },

    confirmSnipesMails: function(resolve) {
        fs.readFile('./json/credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);

            // Authorize a client with credentials, then call the Gmail API.

            authorize(JSON.parse(content), this.confirmSnipesMailsAsync, resolve)
        });
    },

    confirmSnipesMailsAsync: function(auth, resolve) {
        const gmail = google.gmail({version: 'v1', auth});
        
        const limiter = new Bottleneck({
            reservoir: 5,
            reservoirRefreshAmount: 5,
            reservoirRefreshInterval: 1000,
            maxConcurrent: 5,
            minTime: 0
        });

        let promises = [];

        gmail.users.messages.list({
            userId: 'me',
            includeSpamTrash: 'false',
            labelIds: 'INBOX',
            q: '"Confirme maintenant - 1 seul clic pour t\'inscrire" from:no-reply@mail.snipes.com',
            maxResults: 500
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err)
            const messages = res.data.messages

            if(messages) {
                messages.forEach((message) => { 
                    promises.push(new Promise((resolve, reject) => {
                        limiter.schedule(() => confirmSnipesMail(resolve, message, gmail))
                    }))
                })

                Promise.all(promises).then((values) => {
                    var results = []
                    values.forEach((value) => {
                        if(value != false) {
                            if(results[value] == undefined) {
                                results[value] = 0
                            }
                            results[value]++
                        }
                    })
                    resolve(results)
                });
            } else {
                resolve(0)
            }
        })
    },

    harvestCouponsZalandoAsync: function(auth, resolve) {
        
        const gmail = google.gmail({version: 'v1', auth});
        
        const limiter = new Bottleneck({
            reservoir: 5,
            reservoirRefreshAmount: 5,
            reservoirRefreshInterval: 1000,
            maxConcurrent: 5,
            minTime: 0
        });

        let promises = [];

        gmail.users.messages.list({
            userId: 'me',
            includeSpamTrash: 'false',
            labelIds: 'INBOX',
            q: '("En cadeau : -10%* sur votre commande" from:info@service-mail.zalando.fr) OR ("10% korting op je bestelling - Jouw eerste exclusieve aanbieding!" from:info@service-mail.zalando.be)',
            maxResults: 500
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err)
            const messages = res.data.messages

            if(messages) {
                messages.forEach((message) => { 
                    promises.push(new Promise((resolve, reject) => {
                        limiter.schedule(() => parcourirMessage(resolve, message, gmail))
                    }))
                })

                Promise.all(promises).then((values) => {
                    var results = []
                    values.forEach((value) => {
                        if(value != false) {
                            if(results[value] == undefined) {
                                results[value] = 0
                            }
                            results[value]++
                        }
                    })
                    resolve(results)
                });
            } else {
                resolve(0)
            }
        })
    },
    listLabels: function (auth) {
        const gmail = google.gmail({version: 'v1', auth});
        gmail.users.labels.list({
            userId: 'me',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const labels = res.data.labels;
            if (labels.length) {
                console.log('Labels:');
                labels.forEach((label) => {
                    console.log(`- ${label.name}`);
                });
            } else {
                console.log('No labels found.');
            }
        });
    },
    authorize: function (credentials, callback) {
        const {client_secret, client_id, redirect_uris} = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getNewToken(oAuth2Client, callback);
            oAuth2Client.setCredentials(JSON.parse(token));
            callback(oAuth2Client);
        });
    },
    getNewToken: function (oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) return console.error(err);
                    console.log('Token stored to', TOKEN_PATH);
                });
                callback(oAuth2Client);
            });
        });
    }

};


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, resolve) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client, resolve);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
    const gmail = google.gmail({version: 'v1', auth});
    gmail.users.labels.list({
        userId: 'me',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const labels = res.data.labels;
        if (labels.length) {
            console.log('Labels:');
            labels.forEach((label) => {
                console.log(`- ${label.name}`);
            });
        } else {
            console.log('No labels found.');
        }
    });
}

function parcourirMessage(resolve, message, gmail) {
    gmail.users.messages.get({
        userId: 'me',
        id: message.id
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err)

        
        for(var key in res.data.payload.headers) {
            if(res.data.payload.headers[key].name == "To") {
                var mail = res.data.payload.headers[key].value
            }
            if(res.data.payload.headers[key].name == "Date") {
                var date = new Date(res.data.payload.headers[key].value)
            }
            if(res.data.payload.headers[key].name == "From") {
                // On get la région du mail, FR ou UK
                var zalando_email = res.data.payload.headers[key].value
                var regexp = zalando_email.match(/(?<=zalando.).*(?=>)/g)
                var region = regexp[0]
            }
        }
        var reception = date.toISOString().split('T')[0]
        var expiration = new Date(date.setMonth(date.getMonth() + 1)).toISOString().split('T')[0]
        // Ici on enlève la string random pour récupérer que l'id du mail
        var temp = mail.split('@')
        var id = temp[0].match(/[0-9]+/g)[0]
        var domain = temp[1]
        var message_content = res.data.payload.parts[1].body.data
        if(message_content) {
            var buff = new Buffer.from(message_content, 'base64')
            var cache = buff.toString()
            var code_promo = cache.match(REG_ZALANDO)[1]

            db.query(`SELECT * FROM coupons_zalando WHERE (mail = ${id} AND catchall = '${domain}') OR coupon = '${code_promo}'`, function(err, res) {
                if(res.length > 0) {
                    // Si pour x raison le code promo est déjà en base on skip
                    gmail.users.messages.trash({
                        userId: 'me',
                        id: message.id
                    }, (err, res) => {
                        if (err) {
                            console.log('The API returned an error: ' + err)
                            resolve(false)
                        } else {
                            resolve(false)
                        }
                    })
                    console.log("cas par defaut")
                    resolve(false)
                } else {
                    
                    db.query(`INSERT INTO coupons_zalando (id, coupon, mail, catchall, claimed, date, date_expiration, region) VALUES (${id}, '${code_promo}', '${id}', '${domain}', 0, '${reception}', '${expiration}', '${region}')`, function(err, res) {
                        console.log(err)
                    })
                    gmail.users.messages.trash({
                        userId: 'me',
                        id: message.id
                    }, (err, res) => {
                        if (err) {
                            console.log('The API returned an error: ' + err)
                            resolve(false)
                        } else {
                            resolve(region)
                        }
                    })
                }
            })
        }
    })
}

function confirmSnipesMail(resolve, message, gmail) {
    gmail.users.messages.get({
        userId: 'me',
        id: message.id
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err)
        // On get la région du mail, FR ou BE
        var region = "fr"

        var mail = res.data.payload.headers[22].value
        var date = new Date(res.data.payload.headers[34].value)
        var reception = date.toISOString().split('T')[0]
        var expiration = new Date(date.setMonth(date.getMonth() + 1)).toISOString().split('T')[0]
        // Ici on enlève la string random pour récupérer que l'id du mail
        var temp = mail.split('@')
        var id = temp[0].match(/[0-9]+/g)[0]
        var domain = temp[1]
        var message_content = res.data.payload.parts[1].body.data
        if(message_content) {
            var buff = new Buffer.from(message_content, 'base64')
            var cache = buff.toString()
            var confirmLink = cache.match(REG_SNIPES)[1]
            console.log(confirmLink)

            fetch(confirmLink).then(response => response.text())
            .then((result) => {
                var secondConfirmLink = result.match(/(?<=href=\").+?(?=")/g)[0]
                secondConfirmLink = secondConfirmLink.replace(/&amp;/g, '&')
                if(!secondConfirmLink.startsWith("https://www.snipes.fr/newsletter")) {
                    var urlObj = new URL(secondConfirmLink)
                    var params = urlObj.searchParams;
                    var finalUrl = "https://www.snipes.fr/newsletter-preferences?"
                    finalUrl += "uid="+params.get("sc_uid")+"&"
                    finalUrl += "confirm=y&utm_source=emarsys&utm_medium=email&utm_campaign=automation_doi_FR_doi__&"
                    finalUrl += "sc_src="+params.get("sc_src")+"&"
                    finalUrl += "sc_lid="+params.get("sc_lid")+"&"
                    finalUrl += "sc_uid="+params.get("sc_uid")+"&"
                    finalUrl += "sc_llid="+params.get("sc_llid")+"&"
                    finalUrl += "sc_customer="+params.get("sc_customer")
                    secondConfirmLink = finalUrl
                }
                console.log(secondConfirmLink)
                fetch(secondConfirmLink).then(response => response.text())
                .then((finalResult) => {
                    console.log(finalResult)
                    console.log("sent!")
                })
                
            });
        }
    })
}