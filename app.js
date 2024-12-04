const express = require('express');
const createHttpError = require('http-errors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
const session = require('express-session');
const connectFlash = require('connect-flash');
const passport = require('passport');
const connectMongo = require('connect-mongo');
const connectEnsureLogin = require('connect-ensure-login');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { roles } = require('./utils/constants'); // Import roles from constants.js


//initialization
const app = express();
app.use(morgan('dev'));
app.use(helmet());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// Trust the first proxy (for example, if you're behind a load balancer)
app.set('trust proxy', 1);

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests
  });
  app.use(limiter);

// Create MongoStore instance for session storage
const store = connectMongo.create({
    mongoUrl: 'mongodb://localhost:27017/sessiondb',
    collectionName: 'sessions',
  });


//Init session 
app.use(
    session({
    secret: process.env.SESSION_SECRET  || 'defaultSecret',
    resave: false,
    saveuninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
    },
    store: store,
  }));

//for passport js authntication
  app.use(passport.initialize());
  app.use(passport.session());
  require('./utils/passport.auth');

//connect flash
app.use(connectFlash());
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    res.locals.user = req.user;
    next();
});

// Middleware to save `returnTo` path
app.use((req, res, next) => {
    if (!req.isAuthenticated() && req.originalUrl) {
      req.session.returnTo = req.originalUrl;
    }
    next();
  });

//routes
app.use('/', require('./routes/index.route'));
app.use('/auth', require('./routes/auth.route'));
app.use(
    '/user', 
    connectEnsureLogin.ensureLoggedIn({ redirectTo: '/auth/login' }),
    require ('./routes/user.route')
);
app.use('/admin', connectEnsureLogin.ensureLoggedIn({ redirectTo: '/auth/login'}), 
ensureAdmin,
require('./routes/admin.route')
);

// Protected route
app.use('/protected-route', ensureAuthenticated, (req, res) => {
    res.send('This is a protected route.');
  });

// Catchall for unmatched routes
app.use((req, res, next) => {
    next(createHttpError.NotFound());
});

//Middleware for Informational Messages
app.use((req, res, next) => {
    if (req.session && req.session.expiration && Date.now() > req.session.expiration - 5 * 60 * 1000) {
      req.flash('info', 'Your session is about to expire. Please save your work.');
    }
    next();
  });
  

//errorhandling middleware
app.use((error, req, res, next) => {
    const status = error.status || 500;
    res.status(error.status).render('error_40x', {error, messages: req.flash() });
});

//making the connection to mongodb
mongoose
    .connect(process.env.MONGO_URL || 'mongodb://localhost:27017/myapp')
    .then(() => {
        console.log('Database connected');
    })
    .catch((err) => {
        console.error(`MongoDB connection error: ${err.message}`);
        process.exit(1);
    });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT , () => { 
    console.log(`Server running on port ${PORT}`)
});

// Middleware: Ensure authentication
function ensureAuthenticated(req, res, next) {
    try {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect('/auth/login');
    } catch (error) {
      next(error);
    }
  }
//admin middleware
  function ensureAdmin(req, res, next) {
    console.log(req.user);  // Log the user object to check if the role is set correctly
    if (req.user && req.user.role === roles.admin) {
      next();
    } else {
      req.flash('warning', 'you are not Authorized to see this route');
      res.redirect('/');
    }
  }

  //moderator
  function ensureModerator(req, res, next) {
    console.log(req.user);  
    if (req.user && req.user.role === roles.moderator) {
      next();
    } else {
      req.flash('warning', 'you are not Authorized to see this route');
      res.redirect('/');
    }
  }


