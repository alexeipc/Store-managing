const express = require('express');
const morgan = require('morgan');
const dotenv = require("dotenv");
const bodyParser = require('body-parser');
const session = require('express-session');

dotenv.config();

const port = process.env.PORT || 3333;
const isProduction = process.env.ENV === "production";
const app = express();

app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(session({
    secret: `${process.env.SECRET_SESSION}`,
    resave: false,
    saveUninitialized: true
}));
const http = require('http').Server(app);
http.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
});

// Socket.io initialize
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
      }
}) ;

// Serve the socket.io.js file as a static asset
const { Socket } = require('dgram');
app.get('/socket.io/socket.io.js', (req, res) => {
    res.sendFile(__dirname + '/node_modules/socket.io/client-dist/socket.io.js');
  });



const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Load functions to interact with database
const { insertToDb } = require('./database_interacting/insert.js');
const { deleteFromDb } = require('./database_interacting/delete.js');
const { insertTypeToDb, ChangePriceFromDb } = require('./database_interacting/insert-type.js');
const { getTypeFromDb, countType, getTypeById } = require('./database_interacting/get-type.js');


// POST request
app.post("/changePrice", urlencodedParser, (req, res) => {
    ChangePriceFromDb(req.body.type, req.body.price);
    res.redirect("management");
});

app.post("/insertType", urlencodedParser, (req, res) => {
    insertTypeToDb(req.body.type,req.body.price);
    res.redirect("/management");
});

app.post("/login", urlencodedParser, (req, res) => {
    if (req.body.key == `${process.env.KEY}`) {
        req.session.isLogin = true;
        res.redirect("/management");
    }
    else {
        res.redirect("/login")
    }
});

// Sites
app.get("/login", (req, res) => {
    if (req.session.isLogin) res.redirect('/management');
    else res.render("login.ejs");
});

app.get("/", (req,res) => {
    // Check authorization
    if (!req.session.isLogin) res.redirect('/login'); 
    else res.redirect('/management');
})

app.get("/import", (req, res) => {
    if (!req.session.isLogin) res.redirect('/login');
    getTypeFromDb(function (type) {
        const products = type.map(item => item.type); // get products' list
        res.render("import.ejs", { products_res: products, socket_link: `${process.env.SERVER}:${process.env.PORT}` }); // render with that list and socket
    });
});

app.get("/history", (req,res) => {
    // Check authorization
    if (!req.session.isLogin) res.redirect('/login');

    // Load selling and importing history from log file
    const fs = require('fs');
    fs.readFile('./log', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
    }
    console.log(data)
    res.render("history.ejs", {log: data});
});

})

app.get("/sell", (req, res) => {
    // Check authorization
    if (!req.session.isLogin) res.redirect('/login');

    getTypeFromDb(function (type) {
        const products = type.map(item => item.type); // get products' list
        res.render("sell.ejs", {socket_link: `${process.env.SERVER}:${process.env.PORT}`}); // render with that list and socket
    });
});

app.get("/management", (req, res) => {
    // Check authorization
    if (!req.session.isLogin) res.redirect('/login');

    getTypeFromDb(function (type) {
        // Get products' names and their prices
        var products = type.map(item => item.type); 
        var prices = type.map(item => item.price);

        var numberOfItem = []; // Array of number of item of each type
        var promises = [];
        for (let i=0; i<products.length; ++i) {
            const promise = new Promise((resolve, reject) => {
                countType(products[i], function(err, cnt) {
                    if (err) {
                        reject(err);
                    } else {
                        numberOfItem.push(cnt);
                        resolve();
                    }
                });
            });
            promises.push(promise);
        }

        // Wait until all promises finished
        Promise.all(promises).then(() => {
            res.render("management.ejs", { products_res: products, prices: prices, pp: numberOfItem });
        }).catch((err) => {
            console.error(err);
            res.status(500).send('Error');
        });
    });
});

// Socket listening
io.on('connection', socket => {
    socket.on('import-product', (id, type) => {
        insertToDb(id,type);

        // Write to selling and importing log file
        const fs = require('fs');
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
        const data = 'Import one ' + type + ' at '+ time +'\n';
        console.log(data);
        fs.appendFile('log', data, function (err) {
            if (err) throw err;
        });
    })

    socket.on('sell-product', (id) => {
        getTypeById(id, function (val) {
            if (val != null) {
                deleteFromDb(id);

                // Write to selling and importing log file
                const fs = require('fs');
                const now = new Date();
                const time = now.toLocaleTimeString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
                const type = val.type;
                const data = 'Sell one ' + type+ ' at '+ time +'\n';

                fs.appendFile('log', data, function (err) {
                    if (err) throw err;
                });
            }
        });
        
    })
})

