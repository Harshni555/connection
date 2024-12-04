const router = require('express').Router();
const User = require('../models/user.model');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const { registerValidator } = require('../utils/validators');

//renderlogin page
router.get('/login', connectEnsureLogin.ensureLoggedOut({redirect: '/'}), (req, res) => {
    res.render('login');
});

//login handler
router.post('/login', connectEnsureLogin.ensureLoggedOut({redirect: '/'}), (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        req.flash('error', 'An error occurred during login.');
        console.error('Authentication error:', err);
        return next(err);
      }
  
      if (!user) {
        console.warn('Authentication failed:', info.message);
        req.flash('error', info.message); // Requires `connect-flash`
        return res.redirect('/auth/login');
      }
  
      req.logIn(user, (err) => {
        if (err) {
          req.flash('error', 'Login failed. Please try again.');
          console.error('Login error:', err);
          return next(err);
        }
        // Use successReturnToOrRedirect to redirect the user to their intended destination or fallback URL
        req.flash('success', 'Logged in successfully!');
        const returnTo = req.session.returnTo || '/'; // Default to '/' if no returnTo exists
        delete req.session.returnTo; // Clear returnTo after redirecting
        return res.redirect(returnTo);
        });
    })(req, res, next);
});
  

//render register page
router.get('/register', connectEnsureLogin.ensureLoggedOut({redirect: '/'}), (req, res) => {
    res.render('Register'); 
});

//register handler
router.post(
    '/register', 
    connectEnsureLogin.ensureLoggedOut({redirect: '/'}),
    registerValidator,
    async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
         errors.array().forEach(error => {
            req.flash('error', error.msg);
         });    
        return res.render('register', { email: req.body.email, messages: req.flash() });
    }

        const { email } = req.body;
        const doesExist = await User.findOne({ email });
        if (doesExist) {
            req.flash('error', 'Email already exists');
            return res.redirect('/auth/register');
        }

        const user = new User(req.body);
        await user.save();
        req.flash('success', `${user.email} registered successfully, and now you can login`);
        res.redirect('/auth/login');
    }   catch (error) {
        next(error);
    }
    
});

// Logout Handler
router.get('/logout', connectEnsureLogin.ensureLoggedIn(), (req, res, next) => {
    req.logout((err) => {
      if (err) {
        req.flash('error', 'An error occurred during logout.');
        return next(err);
      }
      req.flash('success', 'You have logged out successfully.');
      return res.redirect('/');
    });
  });

// Export router
module.exports = router;


// Uncomment and fix if these functions are needed
/*
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/auth/login');
  }
  
  function ensureNOTAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('back');
    }
    next();
  }
    
  */