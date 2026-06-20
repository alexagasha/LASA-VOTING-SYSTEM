const db = require("./db/db");
const voters = require("./voters");

db.serialize(() => {

  voters.forEach(voter => {

    db.run(
      `INSERT OR IGNORE INTO voters
      (voter_id,name,email,pin,voted,role)
      VALUES(?,?,?,?,?,?)`,
      [
        voter.id,
        voter.name,
        voter.email,
        voter.pin,
        voter.voted ? 1 : 0,
        voter.role
      ]
    );

  });

  console.log("All voters imported");
});

db.close();