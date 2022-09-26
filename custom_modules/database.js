const mysql = require('mysql');

const db_config = {
    // YOUR DB CONFIG
}

//var db;

const db = mysql.createPool(db_config)

function handleDisconnect() {
    db = mysql.createConnection(db_config);
  
    db.connect(function(err) {
        if(err) {
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 200);
        }
        console.log("Connecté à la base de données MySQL!");
    });

    db.on('error', function(err) {
        console.log('db error', err);
        console.log(err.code)
        console.log(err.code === 'PROTOCOL_CONNECTION_LOST')
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

//handleDisconnect()

module.exports = db