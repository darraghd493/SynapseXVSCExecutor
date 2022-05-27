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
    
    executeScript(client, activeEditor.document.getText());
}

function executeScript(client, script) {
    if (!authenticated)
        return vscode.window.showInformationMessage("Not authenticated with a client.");

    client.send(script);
}

function executeTest(client) {
    executeScript(client, 'print("Test print")\nwarn("Test warn")\nerror("Test error")')
}

function activate(context) {
    let scriptClient;
    let messageClient;

    // Setup the script server
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
        
        ws.on("close", (message) => {
            try {
                authenticated = false;
                messageClient.close();
                vscode.window.showInformationMessage("Closed connection with client.");
            } catch (e) {
                vscode.window.showErrorMessage("Failed to terminate message websocket connection on script websocket close.");
            }
        });
    });

    // Setup the message server
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
        
        ws.on("close", (message) => {
            try {
                authenticated = false;
                scriptClient.close();
                vscode.window.showInformationMessage("Closed connection with client.");
            } catch (e) {
                vscode.window.showErrorMessage("Failed to terminate script websocket connection on script websocket close.");
            }
        });
    });

    // Register the commands
    let executeDisposable = vscode.commands.registerCommand('synapse-x-vsc-executor.execute', () => {
        execute(scriptClient);
    });
    context.subscriptions.push(executeDisposable);
    
    let executeTestDisposable = vscode.commands.registerCommand('synapse-x-vsc-executor.test', () => {
        executeTest(scriptClient);
    });
    context.subscriptions.push(executeTestDisposable);
    
    let executeStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
    executeStatusBar.text = "Execute Script";
    executeStatusBar.command = 'synapse-x-vsc-executor.execute';
    executeStatusBar.show();
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