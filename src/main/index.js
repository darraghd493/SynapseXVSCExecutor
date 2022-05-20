const vscode = require('vscode');
const { WebSocketServer } = require('ws');
const axios = require('axios');

let authenticated = false;
let scriptServer;
let messageServer;

let settings = {
    scriptServer: {
        port: 27968
    },
    messageServer: {
        port: 27969
    }
}

function execute(client) {
    var activeEditor = vscode.window.activeTextEditor;

    if (activeEditor === undefined)
        return vscode.window.showInformationMessage("No active editor.");

    if (!authenticated)
        return vscode.window.showInformationMessage("Not authenticated with a client.");
    
    client.send(activeEditor.document.getText());
}

function activate(context) {
    let scriptClient;
    let messageClient;

    scriptServer = new WebSocketServer({
        port: settings.scriptServer.port
    });

    scriptServer.on("connection", (ws) => {
        scriptClient = ws;
        
        ws.on("message", (message) => {
            let parsedData = JSON.parse(message);
            let url = `https://users.roblox.com/v1/users/${parsedData['userId']}`;

            axios.default.get(url, {
                responseType: "json"
            }).then(res => {
                var userData = res.data;
                
                if (userData['displayName'] !== undefined) {
                    authenticated = true;
                    vscode.window.showInformationMessage(`Successfully authenticated with ${userData["displayName"]}.`);
                } else
                    vscode.window.showErrorMessage("Failed to authenticate.")
            });
        });
    });

    messageServer = new WebSocketServer({
        port: settings.messageServer.port
    });

    messageServer.on("connection", (ws) => {
        messageClient = ws;

        ws.on("message", (message) => {
            if (!authenticated)
                return;

            let parsedData = JSON.parse(message);
            let messageString = parsedData['message'];
            let type = parsedData['type'];

            switch (type) {
                case 0:
                    vscode.window.showInformationMessage(messageString);
                    console.log("Print: " + messageString);
                    break;
                case 1:
                    vscode.window.showWarningMessage(messageString);
                    console.warn("Warn: " + messageString);
                    break;
                case 2:
                    vscode.window.showErrorMessage(messageString);
                    console.error("Error: " + messageString);
                    break;
                default:
                    vscode.window.showInformationMessage(messageString);
                    console.log("Print: " + messageString);
                    break;
            }
        });
    });

    
    let disposable = vscode.commands.registerCommand('synapse-x-vsc-executor.execute', () => {
        execute(scriptClient);
    });
    context.subscriptions.push(disposable);

    
    let statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
    statusBar.text = "Execute Script";
    statusBar.command = 'synapse-x-vsc-executor.execute';
    statusBar.show();
}

function deactivate() {
    if (!scriptServer)
        return;
    scriptServer.close();
}

module.exports = {
    activate,
    deactivate
}