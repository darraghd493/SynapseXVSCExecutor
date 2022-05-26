# Synapse X VSC Executor
For a friend.

## Features
This extension automatically executes your scripts from Visual Studio Code to Synapse X with support for messages.

## How to use
To use this, you will first want to put this script into your auto-execution folder of Synapse X:

### Minified
```lua
local a=game:GetService("HttpService")local b=game:GetService("Players")repeat wait()until b.LocalPlayer;local c={scriptServer={port=27968},messageServer={port=27969}}local d=syn.websocket.connect("ws://localhost:"..tostring(c["scriptServer"]["port"]))local e=syn.websocket.connect("ws://localhost:"..tostring(c["messageServer"]["port"]))local f=print;local g=warn;local h=error;function newPrint(i)e:Send(a:JSONEncode({message=i,type=0}))f(i)end;function newWarn(i)e:Send(a:JSONEncode({message=i,type=1}))g(i)end;function newError(i)e:Send(a:JSONEncode({message=i,type=2}))h(i)end;print=newPrint;warn=newWarn;error=newError;d.OnMessage:Connect(function(j)local k,error=loadstring(j)if error then return newError("Error:\n"..err)end;k()end)d:Send(a:JSONEncode({userId=b.LocalPlayer.UserId}))
```

<b>*The original script can be found in the scripts folder for the extension.*</b>

<br>
And this will automatically connect to the websocket servers hosted on Visual Studio Code. Now you will just want to go into Preferences > Keyboard Shortcuts and set the short cut `synapse-x-vsc-executor.execute` to what ever keybind you want to execute your script.

## How it works
Instead of hosting a normal and single server for sending scripts like many other extensions do - this instead hosts two - one for managing the scripts being sent and authenticating the user - and the other for receiving print messages, warnings and errors. 

To authenticate the user, they will send their user id automatically through the script websocket and their Roblox account will be checked if it exist, and if so, they will be authenticated and an alert will notify you about the authentication within Visual Studio Code.
