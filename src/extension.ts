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
            mu.clearCache();
            mu.root = path.dirname(`${fileDir}\\${template.mustacheFile}`)
            mu.fileName = path.basename(template.mustacheFile)
            mu.extension = path.extname(template.mustacheFile)
            let result = "";
            mu.compileAndRender(mu.fileName, metadata)
                .on('data', function (data) {
                    result += data.toString();
                })
                .on("end", function () {
                    let contextFile = "";
                    let countFiles = 0;
                    result.split('\n').forEach(line => {
                        if (line.substr(0, 8) == "---<EOF:") {
                            line = line
                                .replace("---<EOF:", "")
                                .replace(">---", "");
                            let jsonEof = JSON.parse(line);

                            const mkdirRecursive = function (dirPath, callback) {
                                try {
                                    let pathCreate = "";
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
                            filePath.replace("//", "/");
                            mkdirRecursive(path.dirname(filePath), () => {
                                writeFileSync(filePath);
                            })
                            contextFile = "";
                            countFiles++;
                        }
                        else {
                            contextFile += line
                        }
                    });
                    vscode.window.showInformationMessage(
                        template.name +
                        " successfully generated with " +
                        countFiles + " file(s) in " + template.outDir
                    );
                });
        });
    });
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}