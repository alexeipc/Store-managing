# Store managing
A Nodejs project to manange stores. It supports the ability to sell and import new items by QR-Scanning as well as manage store's inventory.

## Features
* Importing:
  - [x] QR-Scanning
  - [ ] Price
* Selling:
  - [x] QR-Scanning
  - [ ] Price
* Business management:
  - [x] Store's inventory managing
  - [x] Selling and importing history
  - [ ] Revenue and profit
  
## How to use
### Requirements:
* Nodejs
### Install and Deploy
#### Intall:
```js
npm install
```
#### Set enviroment variables
- Create file name **.env**.
- Use environment variables:
```
PORT = <server port>
MONGO_HOST = <mongodb server adress>
MONGO_PORT = <mongodb port>
MONGO_DB = <mongodb's database>
MONGO_PRODUCT_COLLECTION = <mongodb's collection>
MONGO_TYPE_COLLECTION = <mongodb's type names' collection>

SECRET_SESSION = <session key>
KEY = <login key>

SERVER = <server adress>
```
#### Deploy:
```
npm run product
```
