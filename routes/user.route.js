const router = require('express').Router();

router.get('/profile', async (req, res, next) => {
   // console.log(req.user);// comment
    const person = req.user;
    res.render('profile', {person});
});

module.exports = router;    