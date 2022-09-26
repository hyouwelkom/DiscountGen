const db = require('./custom_modules/database')
const gmail = require('./custom_modules/gmail');
const { Client, Intents, MessageEmbed } = require('discord.js');
const http = require('http');
var request = require('request');
const fs = require('fs');
const { resolve } = require('path');
const fetch = require('node-fetch');

const claimedRecently = new Set();


const client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] })
const PREFIX = '!'
const SETTINGS = {
    Zalando : {
        regions : [
            {
                name : "France",
                code : "fr",
                flag : "🇫🇷"
            },
            {
                name : "Belgique",
                code : "be",
                flag : "🇧🇪"
            }
        ],
        messageId: // Message id of the embed to edit,
        catchall: // Your catchall,
        logsChannelId: // Logs channel id,
        channelId: // Channel id where you want to post the embed
    },
    admins : [
        // Discord ID of the admins
    ]
}

function isAuthorized(user) {
    if(SETTINGS.admins.length > 0) {
        return SETTINGS.admins.includes(user.id)
    } else {
        user.send("Non autorisé")
        return false
    }
}

function randomString(length = 8) {
    // Declare all characters
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    // Pick characers randomly
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;

};


function submitFormZalando(mail, region) {
    var options = {
        'method': 'POST',
        'url': `https://www.zalando.${region}/api/graphql/`,
        'headers': {
            'sec-ch-ua': '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
            'x-xsrf-token': 'AAAAAGYagQAAPPqg8yiAilHjD7XwHvT9Td139WnkX4vuxW11UNU9504-4sRI1Az95VPbB2XNZpQBin4bUE6W_qFFHrHiF9s1nUB8of6b3SvJpCg1yPCGjicYhgPA24NmpLJNCKf6rD-gCesAZLLo96Y=',
            'sec-ch-ua-mobile': '?0',
            'User-Agent': 'PostmanRuntime/7.26.10',
            'x-zalando-intent-context': 'navigationTargetGroup=ALL',
            'content-type': 'application/json',
            'x-zalando-request-uri': '/zalando-newsletter/',
            'x-page-impression-id': 'rendering-engine-923cda38-6c22-40ca-b95a-9e070b3de6a0',
            'DPR': '1',
            'Viewport-Width': '1920',
            'Accept': '*/*',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
            'Cookie': 'Zalando-Client-Id=8a25c620-ec4c-4143-aa2e-953989ef75d9; _abck=88A621D9B5B116C60C603E41ECF73BC4~-1~YAAQLYQVAgotcXx7AQAAOxr/igaJgheoRMe70B8FcA5zYZF8998wVNEkPmZXHGvkGl8UbpAR0bGJncjZUmksCeaTLG/vRzrkgKhBuYAA/FDrItDijwtu5uKDfPZm0ivRMEwzXPQEyvdKrcjuXaCrKP+uv9Uhug/DwfnH9ROgWYoakmxmiQlkhJmUjGM7k2Hj+kGAzWazT8WRxWY079GSj2dXJugOFYq3Av2j3Mwy3ctwx+ebBux8Fgm3R/TeJi1MCQSInP5mPaa/eFoV1cc9/W2oWSiZAq8yELUPeZLTy3Bbo4lVp9Rg9mPlRLmAJFsQ1GGXa4MpRe3D9GkSvpsUL2ZbC+qvk7FhLqmkMHezROG+RcoD84fUxpMgsQcIPfmRb3uSF8iuxRVMGVc=~-1~-1~-1; bm_sz=677B100BC025A41BB060A6FE5E1C1F83~YAAQLYQVAgstcXx7AQAAOxr/igzVFEs60nJYVjmeQY93GNECYKjnCuj7T1JPe6doZauIg0OBUx+jyzbJdpyS8+TKd+upXgqMEvRckPC3f3rVdoCVtCfL4B+NwYDTCd4JvzS6zbpgTVH/YzDB+QqHPktFP3o55KYwARthxCtGKZVXoVJkq3BPBqqZ+zYmG7C2AvaigFNt/xFxAbBTZE4HEH3OLoGp5fwQem9hmmjD2l2yDsyJH/HkRlvwODPtdbbww8nwiBMoKclGQgBcmTLQPLkpVQethiPIJ23THBaVaO75EIk+RgOWJwiG0oZUMrBtCpBq9mB8spCY0+sOViCvAWAKEaffg3LBvwBEmGswcnqqoOC22sdhV4+YAhhBL4RS4t/2VblatbRMdRzld411~4272961~4600113'
        },
        body: JSON.stringify([
            {
            "id": "f321f59294a4ffd369951dc5d8f92b801cb7c3c7302de9e5118b3569416c844f",
            "variables": {
                "input": {
                "email": randomString(8)+mail+"@"+SETTINGS.Zalando.catchall,
                "preference": {
                    "category": "WOMEN",
                    "topics": [
                    {
                        "id": "item_alerts",
                        "isEnabled": true
                    },
                    {
                        "id": "survey",
                        "isEnabled": false
                    },
                    {
                        "id": "recommendations",
                        "isEnabled": false
                    },
                    {
                        "id": "fashion_fix",
                        "isEnabled": false
                    },
                    {
                        "id": "follow_brand",
                        "isEnabled": false
                    },
                    {
                        "id": "subscription_confirmations",
                        "isEnabled": false
                    },
                    {
                        "id": "offers_sales",
                        "isEnabled": false
                    }
                    ]
                },
                "referrer": "nl_subscription_page",
                "clientMutationId": "1614632823486"
                }
            }
            }
        ])
    };
    try {
        console.log("sending request to newsletter")
        request(options, function (error, response) {
            console.log(response.body, error);
        });
    } catch(error) {
        console.log(error)
    }
    
}

function getBulk(site, region, number, user) {
    if(isAuthorized(user)) {
        var today = new Date().toISOString().split('T')[0]
        db.query(`SELECT * FROM coupons_zalando WHERE claimed = 0 AND date_expiration > '${today}' AND region = "${region}" LIMIT ${number}`, function(err, res) {
            if(res.length > 0 && res.length == number) {
                try {
                    var codes = []
                    var ids = []
                    res.forEach((code) => {
                        codes.push(code.coupon)
                        ids.push(code.id)
                    })
                    
                    user.send(codes.join('\r')).catch(() => console.log("Can't send DM to your user!"));
                } catch(error) {
                    console.log(error)
                }

                db.query(`UPDATE coupons_zalando SET claimed = 1 WHERE id IN (${ids.join(', ')})`, function(err, res) {
                    editEmbeddedMessage("Zalando")
                })
            } else {
                user.send(`Seulement ${res.length} code promo disponible, rajoute en bg`)
            }
        })
    }
}

function generateCoupon(site, region, number, user) {
    if(isAuthorized(user)) {
        if(site.toLowerCase() == "zalando") {
            if(region == "fr" || region == "be") {
                user.send(`Vous avez demandé à générer ${number} codes sur ${site}.${region}`)
                db.query(`SELECT MAX(id) AS max FROM coupons_zalando WHERE catchall = '${SETTINGS.Zalando.catchall}' LIMIT 1`, function(err, res) {
                    if(res[0].max == null) res[0].max = 0
                    if(err) console.log("Erreur BDD")
                    var max = parseInt(res[0].max)+1
                    var total = max+parseInt(number, 10)
    
                    for(var i = max; i < total; i++) {
                        submitFormZalando(i, region)
                    }
                })
            } else {
                user.send("Région non prise en charge.")
            }
        } else if(site.toLowerCase() == "snipes") {
            if(region == "fr" || region == "be") {
                user.send(`Vous avez demandé à générer ${number} codes sur ${site}.${region}`)
                db.query(`SELECT MAX(id) AS max FROM coupons_snipes WHERE catchall = '${SETTINGS.Snipes.catchall}' LIMIT 1`, function(err, res) {
                    if(err) console.log("Erreur BDD")
                    var max = parseInt(res[0].max)+1
                    var total = max+parseInt(number, 10)
    
                    for(var i = max; i < total; i++) {
                        submitFormSnipes(i, region)
                    }
                })
            } else {
                user.send("Région non prise en charge.")
            }
        } else {
            user.send("Site non pris en charge.")
        }
    }
}

function editEmbeddedMessage(site) {
    if(site.toLowerCase() == "zalando") {
        var today = new Date().toISOString().split('T')[0]
        db.query(`SELECT COUNT(IF(claimed = 0 AND date_expiration > '${today}' AND region = "fr", 1, null)) AS nbCouponsFr, COUNT(IF(claimed = 0 AND date_expiration > '${today}' AND region = "be", 1, null)) AS nbCouponsBe FROM coupons_zalando`, function(err, res) {

            console.log(res[0].nbCouponsFr)
            if(res[0].nbCouponsFr == 50) {
                client.channels.cache.get(SETTINGS.Zalando.logsChannelId).send("<@509735707640725514>, pool de codes promos Zalando.FR bientôt vide");
            }
            
            if(res[0].nbCouponsBe == 50) {
                client.channels.cache.get(SETTINGS.Zalando.logsChannelId).send("<@509735707640725514>, pool de codes promos Zalando.BE bientôt vide");
            }


            const zalandoEmbed = new MessageEmbed()
                .setColor('#fb642d')
                .setAuthor('Codes promos Zalando', 'attachment://nf.png', 'https://www.notify-france.fr/dashboard')
                .setDescription(`Réagissez avec l'emoji correspondant à la région voulue pour obtenir un code\nAttention à ne pas abuser sous peine de clip le bot, on vérifie les logs`)
                .setThumbnail('attachment://zalando.png')
                .addFields(
                    { name: '🇫🇷', value: res[0].nbCouponsFr.toString() ?? "0", inline: true },
                    { name: '🇧🇪', value: res[0].nbCouponsBe.toString() ?? "0", inline: true }
                )
                .setTimestamp()
                .setFooter('Powered by Notify France', 'attachment://nf.png');


            client.channels.cache.get(SETTINGS.Zalando.channelId).messages.fetch(SETTINGS.Zalando.messageId).then(message => {
                
                message.edit({
                    embeds: [zalandoEmbed]
                })
            })
        })
    }
}

function confirmMails(site, user) {
    if(isAuthorized(user)) {
        if(site.toLowerCase() == 'snipes') {
            user.send('Confirmation des inscriptions aux newsletters Snipes')
            let res = new Promise((resolve, reject) => {
                gmail.confirmSnipesMails(resolve)
            })

            res.then((nb_confirms) => {
                Object.keys(nb_confirms).forEach( key => {
                    user.send(`${nb_confirms} mails ont été confirmés`)
                  })
                
                  if(nb_confirms === 0) {
                      user.send("Aucune inscription à confirmer dans la boîte mail")
                  }
                editEmbeddedMessage('snipes')
            })
        } else {
            user.send("Site non pris en charge.")
        }
    }
}

function harvestCoupons(site, user) {
    if(isAuthorized(user)) {
        user.send('Sauvegarde des codes promos dans la pool en cours')
        if(site.toLowerCase() == 'zalando') {
            let res = new Promise((resolve, reject) => {
                gmail.harvestCouponsZalando(resolve)
            })

            res.then((nb_coupons) => {
                console.log(nb_coupons)
                Object.keys(nb_coupons).forEach( key => {
                    user.send(`${nb_coupons[key]} codes promos (${key}) ont été sauvegardé(s) dans la pool`)
                  })
                
                  if(nb_coupons === 0) {
                      user.send("Aucun code promo dans la boite mail")
                  }
                editEmbeddedMessage('zalando')
            })
        } else if(site.toLowerCase() == 'snipes') {
            let res = new Promise((resolve, reject) => {
                gmail.harvestCouponsSnipes(resolve)
            })

            res.then((nb_coupons) => {
                Object.keys(nb_coupons).forEach( key => {
                    user.send(`${nb_coupons[key]} codes promos (${key}) ont été sauvegardé(s) dans la pool`)
                  })
                
                  if(nb_coupons === 0) {
                      user.send("Aucun code promo dans la boite mail")
                  }
                  // Il faut edit l'embed de snipes et non de Zalando
                editEmbeddedMessage('snipes')
            })
        } else {
            user.send("Site non pris en charge.")
        }
    }
}

client.on('ready', () => {
    client.user.setStatus('available')
    console.log(`Logged in as ${client.user.tag}!`);
});

function displaySettingsEmbed(user) {
    if(isAuthorized(user)) {
        var adminsList = ""

        if(SETTINGS.admins.length > 0) {
            SETTINGS.admins.forEach((admin) => {
                adminsList += `<@${admin}>\r\n`
            })
        } else {
            adminsList = "Non renseigné"
        }

        var regionsList = ""
        if(SETTINGS.Zalando.regions.length > 0) {
            SETTINGS.Zalando.regions.forEach((region) => {
                regionsList += `- ${region.flag} ${region.name} (${region.code})\r\n`
            })
        } else {
            regionsList = "Aucune région"
        }


        const settingsEmbed = new MessageEmbed()
        .setColor('#fb642d')
        .setTitle("Settings du générateur de codes promos")
        .setAuthor('Codes promos Zalando', 'attachment://nf.png', 'https://www.notify-france.fr/dashboard')
        .addFields(
            { name: 'Id du channel du bot', value: SETTINGS.Zalando.channelId != "" ? SETTINGS.Zalando.channelId : "Non renseigné" },
            { name: 'Admins', value: adminsList }
        )
        .setTimestamp()
        .setFooter('Powered by Notify France', 'attachment://nf.png');

        const settingsZalandoEmbed = new MessageEmbed()
        .setColor('#fb642d')
        .setTitle("Settings Zalando")
        .setAuthor('Codes promos Zalando', 'attachment://nf.png', 'https://www.notify-france.fr/dashboard')
        .addFields(
            { name: 'Id du message', value: SETTINGS.Zalando.messageId != "" ? SETTINGS.Zalando.messageId : "Non renseigné" },
            { name: 'Catchall', value: SETTINGS.Zalando.catchall != "" ? SETTINGS.Zalando.catchall : "Non renseigné" },
            { name: 'Id du channel de logs', value: SETTINGS.Zalando.logsChannelId != "" ? SETTINGS.Zalando.logsChannelId : "Non renseigné" },
            { name: 'Régions', value: regionsList }
        )
        .setTimestamp()
        .setFooter('Powered by Notify France', 'attachment://nf.png');

        user.send({
            embeds: [settingsEmbed],
            files: [{
                attachment:'./assets/nf.png',
                name:'nf.png'
            }]
        })
        user.send({
            embeds: [settingsZalandoEmbed],
            files: [{
                attachment:'./assets/nf.png',
                name:'nf.png'
            }]
        })
    }
}

function postEmbedMessage(site, channelId, user) {

    if(site.toLowerCase() == "zalando") {
        var today = new Date().toISOString().split('T')[0]
        db.query(`SELECT COUNT(IF(claimed = 0 AND date_expiration > '${today}' AND region = "fr", 1, null)) AS nbCouponsFr, COUNT(IF(claimed = 0 AND date_expiration > '${today}' AND region = "be", 1, null)) AS nbCouponsBe FROM coupons_zalando`, function(err, res) {

            var regionsList = ""
            if(SETTINGS.Zalando.regions.length > 0) {
                SETTINGS.Zalando.regions.forEach((region) => {
                    regionsList += `- ${region.flag} ${region.name} (${region.code})\r\n`
                })
            } else {
                regionsList = "Aucune région"
            }

            const zalandoEmbed = new MessageEmbed()
                .setColor('#fb642d')
                .setAuthor('Codes promos Zalando', 'attachment://nf.png', 'https://www.notify-france.fr/dashboard')
                .setDescription(`Réagissez avec l'emoji correspondant à la région voulue pour obtenir un code\nAttention à ne pas abuser sous peine de clip le bot, on vérifie les logs`)
                .setThumbnail('attachment://zalando.png')
                .addFields(
                    { name: '🇫🇷', value: res[0].nbCouponsFr.toString() ?? "0", inline: true },
                    { name: '🇧🇪', value: res[0].nbCouponsBe.toString() ?? "0", inline: true }
                )
                .setTimestamp()
                .setFooter('Powered by Notify France', 'attachment://nf.png');

            var channel = client.channels.cache.get(channelId)

            if(channel == undefined) {
                user.send("Channel id invalide")
            } else {

                client.channels.cache.get(channelId).send({
                    embeds: [zalandoEmbed],
                    files: [
                        {
                            attachment:'./assets/nf.png',
                            name:'nf.png'
                        },
                        {
                            attachment:'./assets/zalando.png',
                            name:'zalando.png'
                        }
                    ]
                }).then((message) => {
                    if(SETTINGS.Zalando.regions.length > 0) {
                        SETTINGS.Zalando.regions.forEach((region) => {
                            message.react(region.flag)
                        })
                    }
                    SETTINGS.Zalando.messageId = message.id
                    user.send("Message pour Zalando posté dans le channel "+channel)
                })
            }
        })
    }
}

function displayHelpEmbed(user) {
    if(isAuthorized(user)) {
        const helpEmbed = new MessageEmbed()
        .setColor('#fb642d')
        .setTitle("Commandes admin générateur de codes promos")
        .setAuthor('Codes promos Zalando', 'attachment://nf.png', 'https://www.notify-france.fr/dashboard')
        .addFields(
            { name: '\u200B', value: '\u200B' },
            { name: '!help', value: 'Affiche la liste des commandes disponibles' },
            { name: '!generate [site] [region] [nombre]', value: 'Génère des codes promos pour un site' },
            { name: '!harvest [site]', value: 'Récupère les codes promos du gmail pour les rajouter au stock' },
            { name: '!settings', value: "Affiche les settings actuelles du bot"},
            { name: '!postEmbed [channelId]', value: "Poste l'embed dans un channel"},
            { name: '\u200B', value: '\u200B' },
            { name: 'Sites disponibles', value: '- Zalando\n- Snipes' },
        )
        .setTimestamp()
        .setFooter('Powered by Notify France', 'attachment://nf.png');

        user.send({
            embeds: [helpEmbed],
            files: [{
                attachment:'./assets/nf.png',
                name:'nf.png'
            }]
        })
    }
}

client.on('messageReactionAdd', async (reaction, user) => {

    if((reaction.message.id == SETTINGS.Zalando.messageId) && (user.id != client.user.id)) {
        
    
        reaction.users.remove(user.id)

        if(claimedRecently.has(user.id)) {
            try {
                user.send("Vous ne pouvez demander un code promo qu'une fois toute les 10 secondes")
            } catch(error) {
                console.log("Un user n'accepte pas les dm")
            }
        } else {
            claimedRecently.add(user.id)

            var flag = reaction.emoji.name
            SETTINGS.Zalando.regions.forEach((settingsRegion) => {
                if(flag == settingsRegion.flag) {
                    region = settingsRegion.code
                }
            })

            var today = new Date().toISOString().split('T')[0]
            db.query(`SELECT * FROM coupons_zalando WHERE claimed = 0 AND date_expiration > '${today}' AND region = "${region}" LIMIT 1`, function(err, res) {
                console.log(today, region, res)
                if(res.length > 0) {
                    const codePromo = new MessageEmbed()
                        .setColor('#fb642d')
                        .setTitle(flag+" "+res[0].coupon)
        
                    try {
                        user.send({ embeds: [codePromo]}).catch(() => console.log("Can't send DM to your user!"));
                    } catch(error) {
                        console.log(error)
                    }

                    const logEmbed = new MessageEmbed()
                        .setColor('#fb642d')
                        .setDescription(`<@${user.id}> a récupéré le code promo Zalando.${region} ${flag} : ${res[0].coupon}`)

                    client.channels.cache.get(SETTINGS.Zalando.logsChannelId).send({ embeds: [logEmbed]})

                    db.query(`UPDATE coupons_zalando SET claimed = 1 WHERE id = ${res[0].id}`, function(err, res) {
                        editEmbeddedMessage("Zalando")
                    })
                } else {
                    editEmbeddedMessage("Zalando")
                    user.send("Aucun code promo disponible, contactez l'admin")
                }
            })
            setTimeout(() => {
                claimedRecently.delete(user.id);
            }, 10000);
        }
    }
})

client.on('messageCreate', msg => {
    if(msg.channel.type === 'DM' && msg.content.startsWith('!')) {
        var parameters = msg.content.split(' ')
        var command = parameters[0];
        if(command === `${PREFIX}generate`) {
            generateCoupon(parameters[1], parameters[2], parameters[3], msg.author)
        }

        if(command === `${PREFIX}harvest`) {
            harvestCoupons(parameters[1], msg.author)
        }

        if(command === `${PREFIX}help`) {
            displayHelpEmbed(msg.author)
        }

        if(command === `${PREFIX}settings`) {
            displaySettingsEmbed(msg.author)
        }

        if(command === `${PREFIX}postEmbed`) {
            postEmbedMessage(parameters[1], parameters[2], msg.author)
        }

        if(command === `${PREFIX}confirm`) {
            confirmMails(parameters[1], msg.author)
        }

        if(command === `${PREFIX}getBulk`) {
            getBulk(parameters[1], parameters[2], parameters[3], msg.author)
        }
    }
});

client.login(YOUR_DISCORD_TOKEN)
