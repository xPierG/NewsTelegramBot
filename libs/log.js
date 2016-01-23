var winston = require('winston');

winston.emitErrs = true;

var serverLogDir = process.env.OPENSHIFT_LOG_DIR || './logs/';
var serverLogFile = serverLogDir + 'all-logs.log';


var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: serverLogFile,
            handleExceptions: true,
            json: false,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};