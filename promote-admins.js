require("dotenv").config();

const { Client } = require("pg");

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const executiveGRs = [
    "AP669",
    "AP684",
    "AP070",
    "AP128",
    "AP674",
    "AP695",
    "AP987",
    "AP010",
    "AP651",
    "AP706",
    "AP019",
    "AQ348",
    "AO070"
];

async function promoteExecutives() {
    try {
        await client.connect();

        console.log("Connected to PostgreSQL.");
        console.log("");

        for (const grNumber of executiveGRs) {

            const result = await client.query(
                "UPDATE members SET role = $1 WHERE gr_number = $2 RETURNING id, name, gr_number, role",
                ["admin", grNumber]
            );

            if (result.rows.length > 0) {
                console.log(
                    "PROMOTED:",
                    result.rows[0].name,
                    "|",
                    result.rows[0].gr_number,
                    "|",
                    result.rows[0].role
                );
            } else {
                console.log(
                    "NOT FOUND:",
                    grNumber
                );
            }
        }

        console.log("");
        console.log("Executive admin update completed.");

    } catch (error) {
        console.error(
            "ERROR:",
            error.message
        );
    } finally {
        await client.end();
    }
}

promoteExecutives();