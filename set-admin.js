const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database/frenchclub.db");

db.run(
    "UPDATE members SET role = 'admin' WHERE gr_number = ?",
    ["AQ090"],
    function (error) {

        if (error) {
            console.log("ERROR:", error.message);
        } else if (this.changes === 0) {
            console.log("No member found with GR number AQ090.");
        } else {
            console.log("AQ090 is now an ADMIN.");
        }

        db.close();
    }
);