const express = require('express');
const morgan = require('morgan');
const dotenv = require("dotenv");
const bodyParser = require('body-parser');
const session = require('express-session');

dotenv.config();

const port = process.env.PORT || 3333;
const isProduction = process.env.ENV === "production";
const app = express();

// --------------------------- SOCKET.IO ----------------------------------
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
      }
}) ;

// Serve the socket.io.js file as a static asset
app.get('/socket.io/socket.io.js', (req, res) => {
    res.sendFile(__dirname + '/node_modules/socket.io/client-dist/socket.io.js');
  });

app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(session({
    secret: `${process.env.SECRET_SESSION}`,
    resave: false,
    saveUninitialized: true
}));

const urlencodedParser = bodyParser.urlencoded({ extended: false });

const { insertToDb } = require('./database/insert.js');
const { deleteFromDb } = require('./database/delete.js');
const { insertTypeToDb, ChangePriceFromDb } = require('./database/insert-type.js');
const { getTypeFromDb, countType, getTypeById } = require('./database/get-type.js');
const { Socket } = require('dgram');

app.post("/changePrice", urlencodedParser, (req, res) => {
    ChangePriceFromDb(req.body.type, req.body.price);
    res.redirect("management");
});

app.post("/insertType", urlencodedParser, (req, res) => {
    insertTypeToDb(req.body.type,req.body.price);
    res.redirect("/management");
});

app.get("/import", (req, res) => {
    if (!req.session.isLogin) res.redirect('/login');
    getTypeFromDb(function (type) {
        const products = type.map(item => item.type);
        res.render("import.ejs", { products_res: products, socket_link: `${process.env.SERVER}:${process.env.PORT}` });
    });
});

app.get("/history", (req,res) => {
    if (!req.session.isLogin) res.redirect('/login');
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

app.get("/login", (req, res) => {
    if (req.session.isLogin) res.redirect('/management');
    else res.render("login.ejs");
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

app.get("/sell", (req, res) => {
    if (!req.session.isLogin) res.redirect('/login');
    getTypeFromDb(function (type) {
        const products = type.map(item => item.type);
        res.render("sell.ejs", {socket_link: `${process.env.SERVER}:${process.env.PORT}`});
    });
});

app.get("/management", (req, res) => {
    if (!req.session.isLogin) res.redirect('/login');
    getTypeFromDb(function (type) {
        var products = type.map(item => item.type);
        var prices = type.map(item => item.price);
        var pp = [];
        var promises = [];
        for (let i=0; i<products.length; ++i) {
            const promise = new Promise((resolve, reject) => {
                countType(products[i], function(err, cnt) {
                    if (err) {
                        reject(err);
                    } else {
                        pp.push(cnt);
                        resolve();
                    }
                });
            });
            promises.push(promise);
        }
        Promise.all(promises).then(() => {
            res.render("management.ejs", { products_res: products, prices: prices, pp: pp });
        }).catch((err) => {
            console.error(err);
            res.status(500).send('Error');
        });
    });
});



http.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
});

io.on('connection', socket => {
    socket.on('import-product', (id, type) => {
        insertToDb(id,type);
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

