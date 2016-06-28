var express = require('express');
var app = express();

var fs = require('fs');

var bodyParser = require('body-parser');

var wikiLinkify = require('wiki-linkify');

var marked = require('marked');

var session = require('express-session');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));
app.set('view engine', 'hbs');

// session timer
app.use(session({
  secret: 'secretCodeWishYouKnewItHa',
  cookie: {
    maxAge: 24 * 60 * 60000
  }
}));

app.get('/', function(req, res){
  res.redirect('/HomePage');
});

// login in page
app.get('/login', function(req, res){
  res.render('login.hbs', {
    title: 'Login'
  });
});

app.post('/login-submit', function(req, res){
  var credentials = req.body;
  if(credentials.username === 'Shanda@hotmail.com' && credentials.password === 'shandasPassword'){
    req.session.user = credentials.username;
    res.redirect(req.session.requestUrl);
  }else {
    res.redirect('/login');
  }
});

app.get('/:pageName', function(req, res){
  var pageName = req.params.pageName;
  var fileName = './pages/' + pageName + '.txt';
  //check to see if a .txt file exist for the title, in pages folder
  fs.access(fileName, fs.F_OK, function(err){
    // if there is an err than the .txt file does not exist
    // send the user to placeholder.hbs, to create the page
    if(err){
      console.log(err);
      res.render('placeholder.hbs', {
        title: pageName
      });
      return;
    }

    // if the .txt file does exist, read data from file
    // render the page with the contents of the text file
    fs.readFile(fileName, function(err, data){

      var dataString = data.toString();
      console.log(dataString);
      if (err) {
        console.log(err);
        res.statusCode = 500;
        res.send("Sorry, problem reading file");
        return;
      }

      fs.writeFile(fileName, dataString, function (err){
        if (err) throw err;
        console.log("Contact form has been saved???");

      });
      var wikiDataString = wikiLinkify(dataString);
      res.render("templatePage.hbs", {
        title: pageName,
        content: marked(wikiDataString)
      });
    });

  }); // end fs.access
});



app.get('/:pageName/edit', authRequired, function(req, res){
  var pageName = req.params.pageName;
  var fileName = './pages/' + pageName + '.txt';
  // check to see if the file .txt file exist
  // if the .txt file exist, get the text contents and display them in the textarea
  fs.access(fileName, fs.F_OK, function(err){
    // err =  pageName.txt does not exist
    // therefore no data in textarea, regular create page
    if(err){
      res.render('edit.hbs',{
        title: 'Edit ' + pageName,
        pageName: pageName
      });
      return;
    }
    else {
      // read the .txt file and display the content in the textarea
      fs.readFile(fileName, function(err, data){
        if(err){
          console.log("there is no data");
          return;
        }else{
          //display contents
          res.render("edit.hbs", {
          title: pageName,
          pageName: pageName,
          content: data.toString()
          });
          return;
        }
      });
    }
  });
});


// handle the save request, POST the contents of a page
app.post('/:pageName/save', authRequired, function(req, res){
  // take info from the form and save it to a file - need a body parser

  // can i recieve the contents of the form, in a javascript object
  var data = req.body;
  var pageName = req.params.pageName;
  var fileName = 'pages/' + pageName + '.txt';
  var dataString = data.content;

  console.log(dataString);

  fs.writeFile(fileName, dataString, function(err){
    if(err){
      console.log("writeFile err msg " + err);
      return;
    } else {
      console.log("wrote " + dataString + 'to ' + fileName);
      // redirect the user back to HomePage
      res.redirect('/' + pageName);
    }
  });
});

// authRequired is a function that
function authRequired(req, res, next){
  if(!req.session.user){
    req.session.requestUrl = req.url;
    res.redirect('/login');
  }else {
    next();
  }
}


app.listen(3000, function(){
  console.log('Listening on port 3000');
});
