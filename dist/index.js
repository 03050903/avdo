"use strict";
// Example: npm run build && node bin/avdo -s '<vector><!-- asdf --></vector>'
Object.defineProperty(exports, "__esModule", { value: true });
var FS = require("fs");
var PATH = require("path");
var PKG = require('../package.json');
var PROGRAM = require("commander");
var util = require("util");
var promisify = util.promisify;
var readFile = promisify(FS.readFile);
var avdo_1 = require("./avdo");
var writeFile = promisify(FS.writeFile);
var xml2js_1 = require("./xml2js");
var js2xml_1 = require("./js2xml");
function execute() {
    PROGRAM.version(PKG.version)
        .arguments('[files...]')
        .option('-s, --string <string>', 'input VD or AVD string')
        .parse(process.argv);
    if (PROGRAM.string) {
        // const parser = new DOMParser();
        // const doc = parser.parseFromString(PROGRAM.string, 'application/xml');
        xml2js_1.xml2js(PROGRAM.string, function (jsApi) {
            console.log(jsApi.content);
            console.log('=====');
            console.log(js2xml_1.js2xml(jsApi, undefined).data);
        }, 
        // TODO: handle error case
        function (error) { });
        // TODO: run in parallel with other args below?
        // TODO: handle rejected case like SVGO
        new avdo_1.Avdo().optimize(PROGRAM.string).then(function (res) { return console.log(res); });
        return;
    }
    PROGRAM.args.forEach(function (file) {
        // TODO: run in parallel
        // TODO: handle rejected case like SVGO
        readFile(file, 'utf8').then(function (data) {
            return processSVGData(undefined, // config,
            { input: 'file', path: file }, data, '-', // output,
            file);
        });
    });
    console.log(PROGRAM.args);
}
/**
 * Optimize SVG data.
 * @param {Object} config options
 * @param {string} data SVG content to optimize
 * @param {string} output where to write optimized file
 * @param {string} [input] input file name (being used if output is a directory)
 * @return {Promise}
 */
function processSVGData(config, info, data, output, input) {
    var startTime = Date.now(), prevFileSize = Buffer.byteLength(data, 'utf8');
    return new avdo_1.Avdo().optimize(data, info).then(function (result) {
        // if (config.datauri) {
        //   result.data = encodeSVGDatauri(result.data, config.datauri);
        // }
        var resultFileSize = Buffer.byteLength(result.data, 'utf8'), processingTime = Date.now() - startTime;
        return writeOutput(input, output, result.data).then(function () {
            if (output != '-') {
                if (input) {
                    console.log("\n" + PATH.basename(input) + ":");
                }
                printTimeInfo(processingTime);
                printProfitInfo(prevFileSize, resultFileSize);
            }
        }, function (error) {
            return Promise.reject(new Error(error.code === 'ENOTDIR'
                ? "Error: output '" + output + "' is not a directory."
                : error));
        });
    });
}
/**
 * Write a time taken by optimization.
 * @param {number} time time in milliseconds.
 */
function printTimeInfo(time) {
    console.log("Done in " + time + " ms!");
}
/**
 * Write optimizing information in human readable format.
 * @param {number} inBytes size before optimization.
 * @param {number} outBytes size after optimization.
 */
function printProfitInfo(inBytes, outBytes) {
    // var profitPercents = 100 - outBytes * 100 / inBytes;
    // console.log(
    //   Math.round(inBytes / 1024 * 1000) / 1000 +
    //     ' KiB' +
    //     (profitPercents < 0 ? ' + ' : ' - ') +
    //     String(Math.abs(Math.round(profitPercents * 10) / 10) + '%').green +
    //     ' = ' +
    //     Math.round(outBytes / 1024 * 1000) / 1000 +
    //     ' KiB',
    // );
    console.log(inBytes, outBytes);
}
/**
 * Write result of an optimization.
 * @param {string} input
 * @param {string} output output file name. '-' for stdout
 * @param {string} data data to write
 * @return {Promise}
 */
function writeOutput(input, output, data) {
    if (output == '-') {
        console.log(data);
        return Promise.resolve();
    }
    return writeFile(output, data, 'utf8').catch(function (error) {
        return checkWriteFileError(input, output, data, error);
    });
}
/**
 * Check for saving file error. If the output is a dir, then write file there.
 * @param {string} input
 * @param {string} output
 * @param {string} data
 * @param {Error} error
 * @return {Promise}
 */
function checkWriteFileError(input, output, data, error) {
    if (error.code == 'EISDIR' && input) {
        return writeFile(PATH.resolve(output, PATH.basename(input)), data, 'utf8');
    }
    else {
        return Promise.reject(error);
    }
}
module.exports = { execute: execute };
