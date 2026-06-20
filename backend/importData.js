const db = require("./db/db");

const candidates = [
  ["Amongi Dolly Diana", "Gulu University"],
  ["Arac Benedict", "Lira University"],
  ["Aceng Delight Ruth", "Uganda Christian University(UCU)"]
];

db.serialize(() => {

  candidates.forEach(candidate => {
    db.run(
      `INSERT OR IGNORE INTO candidates(name, party)
       VALUES(?, ?)`,
      candidate
    );
  });

  console.log("Candidates imported");
});

db.close();