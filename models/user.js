/** User class for message.ly */

const db = require("../db");
const bcrypt = require("bcrypt");
const ExpressError = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config");


/** User of the site. */

class User {

  static async register({username, password, first_name, last_name, phone}) { 
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
   try {
     let hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
     const newUser = await db.query(
      `INSERT INTO users 
       (username, password, first_name, last_name, phone, join_at, last_login_at)
       VALUES 
       ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
       RETURNING username, password, first_name, last_name, phone`,
       [username, hashedPassword, first_name, last_name, phone]
    );
    return newUser.rows[0];

  } catch(error){
    throw new ExpressError(error.message, 400);
  }
}


  static async authenticate(username, password) { 
    /** Authenticate: is this username/password valid? Returns boolean. */
    try {
      const findUser = await db.query(
        `SELECT password FROM users WHERE username = $1`,
        [username]
      );

      const userFound = findUser.rows[0];

      if (userFound) {
        return await bcrypt.compare(password, userFound.password);
      }
      throw new ExpressError('Invalid user or password', 400);
    } catch (error) {
      throw new ExpressError(error.message, 400);
    }
  }


  static async updateLoginTimestamp(username) { 
  /** Update last_login_at for user */
  try{
    const updateLoginTime = await db.query(
    `UPDATE users
     SET last_login_at = current_timestamp
     WHERE username = $1
     RETURNING username`,
     [username]
   );

  if (updateLoginTime.rows[0]) {
    return updateLoginTime.rows[0];
  }
    
    throw new ExpressError(`User not found with named: ${username}`, 400);

  } catch(error){
    throw new ExpressError(error.message, 400);
 }
}


  static async all() { 
  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

   try {
    const allUsers = await db.query(
      `SELECT username, first_name, last_name, phone FROM users`
    );
      return allUsers.rows;
    } catch (error) {
      throw new ExpressError(error.message, 400);
  }
}


  static async get(username) {
  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */
   try {
    const findUserName = await db.query(
    `SELECT username, first_name, last_name, phone, join_at, last_login_at 
     FROM users WHERE username = $1`,
     [username]
    );

    const userNameFound = findUserName.rows[0];

    if (userNameFound) {
      return userNameFound;
    }
      throw new ExpressError('Invalid user or password', 400);
    } catch (error) {
      throw new ExpressError(error.message, 400);
  }
}

  static async messagesFrom(username) {
  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */


   try {
      const msg = await db.query(
        `SELECT m.id,
              m.to_username,
              t.first_name,
              t.last_name,
              t.phone,
              m.body,
              m.sent_at,
              m.read_at
        FROM messages AS m
        JOIN users AS t ON m.to_username = t.username
        WHERE m.from_username = $1`,
        [username]
      );

      let messages = msg.rows.map((m) => ({
        id: m.id,
        to_user: {
          username: m.to_username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone,
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      }));

      return messages;
  } catch (error) {
    throw new ExpressError(error.message, 400);
  }

}

  static async messagesTo(username) {
  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

    try {
      const msg = await db.query(
        `SELECT m.id,
              m.from_username,
              f.first_name,
              f.last_name,
              f.phone,
              m.body,
              m.sent_at,
              m.read_at
        FROM messages AS m
          JOIN users AS f ON m.from_username = f.username
        WHERE m.to_username = $1`,
        [username]
      );

      let messages = msg.rows.map((m) => ({
        id: m.id,
        from_user: {
          username: m.from_username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone,
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      }));

      return messages;
    } catch (error) {
      throw new ExpressError(error.message, 400);
    }
  }
}


module.exports = User;