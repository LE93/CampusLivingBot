# CampusLivingBot
This bot informs you whenever a new room in an apartment at ETH is available.

It uses a Node.js-server that polls the ETH-website every 5 minutes.
Whenever a new room is available, a message will be sent to all registered-users using the Telegram-bot.

## 1. Bot
To use the bot just open [this](https://t.me/CampusLivingBot) link in [Telegram](https://telegram.org).

## 2. Set-up
- Install [Node.js](https://nodejs.org/).
- Run *npm install* in the root-directory to install all dependencies.
- Do all your configurations (see **3. Project configuration**).
- Run the project with *npm start* (or just use *node index.js*).

## 3. Project configuration
There are 2 config-files that have to be created manually and their location and names must be specified in *pathsConfig.json* (or *local-pathsConfig.json*).
### 3.1. Webservice
The webservice config-file is a json-file containing the endpoint of the webservice as well as the room-status that will be queried.

Possible status are: "1" = *frei*, "2" = *reserviert*, "3" = *besetzt*, "" = *alle*.

Example (use exactley these keys):
```json
{
  "endpointURL":"http://my-http-endpoint.com",
  "roomStatus":"2"
}
```
### 3.2. Telegram-bot
The Telegram-bot config-file is a json-file containing the token provided by the holy [BotFather](https://t.me/BotFather).

Example (use exactley these keys):
```json
{
  "token":"1234abc"
}
```
### 3.3. Paths
Open the *pathsConfig.json*-file (or create a *local-pathsConfig.json*-file in the root directory) and specify the location and name of all the config-files (see 2.1 & 2.2).

The file *MainStore.db* doesn't have to be created manually (the bot will do it for you). Just make sure that you choose a path that is persisted by your build-server.
Otherwise you'll lose all users and they can't be informed about new rooms anymore!

Example (use exactley these keys):
```json
{
  "mainStore" : "MainStore.db",
  "svcConfig" : "./config/svcConfig.json",
  "botConfig" : "./config/botConfig.json"
}
```
