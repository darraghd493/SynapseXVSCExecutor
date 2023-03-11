local httpService = game:GetService("HttpService")
local players = game:GetService("Players")

-- Wait for the local player
repeat
    wait()
until players.LocalPlayer

local settings = {
    scriptServer = {
        port = 27968
    },
    messageServer = {
        port = 27969
    }
}

-- Connect to the local websocket servers
local scriptServer
local messageServer

while wait() do
    if pcall(function() scriptServer = syn.websocket.connect("ws://localhost:" .. tostring(settings["scriptServer"]["port"])) end) then
        print("Connected to the script server!")
        break
    else
        error("Failed to connect to the script server. Trying again in 1 second...")
        wait(1)
    end
end

while wait() do
    if pcall(function() messageServer = syn.websocket.connect("ws://localhost:" .. tostring(settings["messageServer"]["port"])) end) then
        print("Connected to the message server!")
        break
    else
        error("Failed to connect to the message server. Trying again in 1 second...")
        wait(1)
    end
end

-- Store the old print, warn and error functions
local oldPrint = print
local oldWarn = warn
local oldError = error

-- Create the new print, warn and error functions
function newPrint(string)
    messageServer:Send(httpService:JSONEncode({
        message = string,
        type = 0
    }))
    oldPrint(string)
end

function newWarn(string)
    messageServer:Send(httpService:JSONEncode({
        message = string,
        type = 1
    }))
    oldWarn(string)
end

function newError(string)
    messageServer:Send(httpService:JSONEncode({
        message = string,
        type = 2
    }))
    oldError(string)
end

-- Replace the print, warn and error functions
print = newPrint
warn = newWarn
error = newError

-- Receieve scripts
scriptServer.OnMessage:Connect(function(code)
    local success, error = loadstring(code)

    if error then
        return newError("Error:\n" .. err)
    end
    
    success()
end)

-- Authenticate the user account
scriptServer:Send(httpService:JSONEncode({
    userId = players.LocalPlayer.UserId
}))
