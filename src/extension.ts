'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs = require('fs');
import path = require('path');
import mu = require('mu2');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "automagic-code" is now active!');    

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('automagicCode.generate', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        const fileDir = path.dirname(editor.document.fileName)
        const config = require(editor.document.fileName);
        const metadata = require(`${fileDir}\\${config.metadataJsonFile}`);
        config.templates.forEach(template => {            
            mu.root = path.dirname(`${fileDir}\\${template.mustacheFile}`)
            mu.fileName = path.basename(template.mustacheFile)
            mu.extension = path.extname(template.mustacheFile)
            mu.compile(mu.fileName, function (err, parsed) {
                if (err) {
                    throw err;
                }

                let result = '';                
                mu.render(parsed, metadata)
                    .on('data', function (data) {
                        const value = data.toString();
                        result += value;
                    })
                    .on('end', function () {
                        let contextFile = '';
                        let countFiles = 0;
                        result.split('\n').forEach(line => {
                            line = verifyCamelCase(line);
                            line = verifyUpperCase(line);
                            line = verifyLowerCase(line);
                            if (line.substr(0, 8) == '---<EOF:') {
                                line = line
                                    .replace('---<EOF:', '')
                                    .replace('>---', '');
                                let jsonEof = JSON.parse(line);

                                const mkdirRecursive = function (dirPath, callback) {
                                    try {
                                        let pathCreate = '';
                                        dirPath
                                            .split('/')
                                            .reduce((path, folder) => {
                                                pathCreate += folder + '/';
                                                if (!fs.existsSync(pathCreate)) {
                                                    fs.mkdirSync(pathCreate);
                                                }
                                            }, '');
                                        return callback()
                                    } catch (err) {
                                        if (err.code !== 'EEXIST') throw err
                                    }
                                }

                                const writeFileSync = async function (filePath) {
                                    try {
                                        await fs.writeFileSync(filePath, contextFile, 'utf8');
                                    } catch (err) {
                                        if (err.code !== 'EEXIST') throw err
                                    }
                                }

                                var regex = /\\/g;
                                var filePath = (`${fileDir}/${template.outDir}/${jsonEof.nameFile}`).replace(regex, '/');
                                filePath.replace('//', '/');
                                mkdirRecursive(path.dirname(filePath), () => {
                                    writeFileSync(filePath);
                                })
                                contextFile = '';
                                countFiles++;
                            }
                            else {
                                contextFile += line
                            }
                        });
                        vscode.window.showInformationMessage(
                            `${template.name} successfully generated with ${countFiles} file(s) in ${template.outDir}`
                        );

                        mu.clearCache(parsed);
                    });
            });
        });
    });
    context.subscriptions.push(disposable);

    function verifyCamelCase(line: string) {
        const camelCaseKey = '#camelCase(\'';
        const posInit = line.indexOf(camelCaseKey);
        if (posInit > -1) {
            let value = line.substr(posInit);
            value = value.substr(camelCaseKey.length, value.indexOf('\')') - camelCaseKey.length);
            line = line.replace(`${camelCaseKey}${value}')`, toCamelCase(value));
        }
        return line;
    }

    function verifyUpperCase(line: string) {
        const camelCaseKey = '#upperCase(\'';
        const posInit = line.indexOf(camelCaseKey);
        if (posInit > -1) {
            let value = line.substr(posInit);
            value = value.substr(camelCaseKey.length, value.indexOf('\')') - camelCaseKey.length);
            line = line.replace(`${camelCaseKey}${value}')`, value.toUpperCase());
        }
        return line;
    }

    function verifyLowerCase(line: string) {
        const camelCaseKey = '#lowerCCase(\'';
        const posInit = line.indexOf(camelCaseKey);
        if (posInit > -1) {
            let value = line.substr(posInit);
            value = value.substr(camelCaseKey.length, value.indexOf('\')') - camelCaseKey.length);
            line = line.replace(`${camelCaseKey}${value}')`, value.toLowerCase());
        }
        return line;
    }

    function toCamelCase(text) {
        text = text.replace(/[-_\s.]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
        return text.substr(0, 1).toLowerCase() + text.substr(1);
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}