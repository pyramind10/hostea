#!/usr/local/bin/node
var fs = require('fs'),
    readline = require('readline'),
    chalk = require('chalk'),
    ip = require('ip'),
    os = require('os'),
    path = require('path'),
    nconf = require('nconf'),
    hostIp = '0.0.0.0',
    terminal = false

if(!process.stdout.isTTY){
    terminal = true
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: terminal
});

const confFile = path.resolve(__dirname,'config.json');
nconf.file({file: confFile});

var defaultConfig = {
    "isSetup": false,
    "defaultService": "apache",
    "autoRestart": "yes",
    "hostIp": "0.0.0.0",
    "sitesAvailableDir": "/etc/apache2/sites-available/",
    "sitesEnabledDir": "/etc/apache2/sites-enabled/",
    "documentRoot": "/var/www/",
    "restartCmd": "service apache2 restart"
}

var startConfigProcess = function(){

    console.log(chalk.green("** HOSTEA CONFIG **"));

    fs.stat(confFile, function(err, stats){
        if(err){
            for(var conf in defaultConfig){
                nconf.set(conf, defaultConfig[conf]);
            }
            nconf.save();
            askSitesAvailableDir()
        }else{
            askSitesAvailableDir(); //TODO finish setup for nginx defaults
        }

    });
    

    // askDefaultService();
    getIpForHostFile();
}

var askDefaultService = function(){

    rl.question(chalk.blue('Select a service ('+nconf.get('defaultService')+') [apache/nginx]: '), function (answer) {

        if(answer.length > 0) {
            nconf.set("defaultService", answer);
        }
        askSitesAvailableDir();
    });
}

var askSitesAvailableDir = function(){
    rl.question(chalk.blue('Sites-Available Directory: ('+nconf.get('sitesAvailableDir')+'): '), function (answer) {

        if(answer.length > 0) {
            nconf.set('sitesAvailableDir', answer);

        }
        askSitesEnabledDir();

    });
}

var askSitesEnabledDir = function(){
    rl.question(chalk.blue('Sites-Enabled Directory ('+nconf.get('sitesEnabledDir')+'): '), function (answer) {

        if(answer.length > 0) {
            nconf.set('sitesEnabledDir', answer);
        }
        askDocumentRoot();

    });
}


var askDocumentRoot = function(){

    rl.question(chalk.blue('Document Root ('+nconf.get('documentRoot')+'): '), function (answer) {

        if(answer.length > 0) {
            nconf.set('documentRoot', answer);
        }

        askHostIp();

    });
}


var askHostIp = function(){
    var isSetup = nconf.get("isSetup");

    if(isSetup == false) {
        hostIp = hostIp;
    }else{
        hostIp = nconf.get('hostIp');
    }

    rl.question(chalk.blue('Host IP Address ('+hostIp+'): '), function (answer) {

        if(answer.length > 0) {
            nconf.set('hostIp', answer);
        }else{
            nconf.set('hostIp', hostIp);
        }

        askRestartCmd()

    });

}

var askRestartCmd = function(){

    rl.question(chalk.blue('Service restart CMD: ('+nconf.get('restartCmd')+'): '), function (answer) {

        if(answer.length > 0) {
            nconf.set('restartCmd', answer);
        }
        askAutoRestart();
    });


}

var askAutoRestart = function(){

    rl.question(chalk.blue('Auto restart ('+nconf.get('autoRestart')+'): [Y/n] : '), function (answer) {

        if(answer == 'n' || answer == 'N' || answer == 'no' || answer == 'No' ) {
            nconf.set('autoRestart', 'no');
        }else{
            nconf.set('autoRestart', 'yes');
        }

        saveConfigFile();
    });


}

var resetConfig = function(){

    for(var conf in defaultConfig){
        nconf.set(conf, defaultConfig[conf]);
        console.log(chalk.yellow(conf)+':', chalk.blue(defaultConfig[conf]));
    }
    nconf.save();
    console.log(chalk.green('Config Reset!!'));
    process.exit(-1);
}




var getIpForHostFile = function(){
    var ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }
            if(ifname == 'eth1'){
                hostIp = iface.address;
            }
            ++alias;
        });


    });
}


var saveConfigFile = function(){
    nconf.set('isSetup', true);
    nconf.save(function (err) {
        console.log(chalk.green('Hostea Configured!'));
        console.log(chalk.inverse('Create new vhost: sudo hostea'))
        process.exit(-1);
        // fs.readFile('./config.json', function (err, data) {
        //     console.dir(JSON.parse(data.toString()))
        // });
    });
}




module.exports =  {
    startConfig: startConfigProcess,
    reset: resetConfig
}



