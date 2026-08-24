const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database/frenchclub.db");

db.run(
    "ALTER TABLE members ADD COLUMN role TEXT NOT NULL DEFAULT 'member'",
    function (error) {

        if (error) {
            console.log("ERROR:", error.message);
        } else {
            console.log("Role column added successfully.");
        }

        db.close();
    }
);