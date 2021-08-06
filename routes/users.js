const Router = require("express").Router;
const User = require("../models/user");
const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");

const router = new Router();


/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get("/", ensureLoggedIn, async function (req, res, next) {
  try {
    let allUsers = await User.all();
    return res.json({allUsers});
  
    } catch (error) {
     return next(error);
  }
});





/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get('/:username', ensureCorrectUser, async function (req, res, next) {
    try {
      const { username } = req.params;
      const userNameFound = await User.get(username);

      if (!userNameFound) {
        throw new ExpressError(`Username ${username} does not exist`, 400);
      }

        return res.json({userNameFound});
    
      } catch (error) {
        return next(error);
    }
  }
);





/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/


router.get("/:username/to", ensureCorrectUser, async function (req, res, next) {
  try {
    let msg = await User.messagesTo(req.params.username);
    return res.json({msg});
  
  } catch (error) {
    return next(error);
  }
});



/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get("/:username/from", ensureCorrectUser, async function (req, res, next) {
  try {
    let msg = await User.messagesFrom(req.params.username);
    return res.json({msg});
  

  } catch (error) {
    return next(error);
  }
});










module.exports = router;