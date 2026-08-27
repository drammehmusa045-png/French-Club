const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

/* =====================================================
   POSTGRESQL CONNECTION
   ===================================================== */

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    }
});

pool.on("error", function (error) {

    console.error(
        "Unexpected PostgreSQL error:",
        error
    );

});


/* =====================================================
   TEST DATABASE CONNECTION
   ===================================================== */

pool.query("SELECT NOW()", function (error) {

    if (error) {

        console.error(
            "PostgreSQL connection failed:",
            error.message
        );

        return;
    }

    console.log(
        "French Club PostgreSQL database connected successfully."
    );

});


/* =====================================================
   CREATE DATABASE TABLES
   ===================================================== */

async function initializeDatabase() {

    try {

        /* =================================================
           MEMBERS
           ================================================= */

        await pool.query(`

            CREATE TABLE IF NOT EXISTS members (

                id SERIAL PRIMARY KEY,

                name TEXT NOT NULL,

                gr_number TEXT NOT NULL UNIQUE,

                class_name TEXT NOT NULL,

                phone TEXT NOT NULL,

                email TEXT,

                password TEXT NOT NULL,

                date_joined TEXT NOT NULL,

                status TEXT NOT NULL DEFAULT 'Active',

                role TEXT NOT NULL DEFAULT 'member',

                profile_picture TEXT

            )

        `);

        console.log("Members table is ready.");


        /* =================================================
           MEETINGS
           ================================================= */

        await pool.query(`

            CREATE TABLE IF NOT EXISTS meetings (

                id SERIAL PRIMARY KEY,

                title TEXT NOT NULL,

                meeting_date TEXT NOT NULL,

                description TEXT,

                created_at TEXT NOT NULL

            )

        `);

        console.log("Meetings table is ready.");


        /* =================================================
           ATTENDANCE
           ================================================= */

        await pool.query(`

            CREATE TABLE IF NOT EXISTS attendance (

                id SERIAL PRIMARY KEY,

                meeting_id INTEGER NOT NULL,

                member_id INTEGER NOT NULL,

                status TEXT NOT NULL DEFAULT 'Absent',

                marked_at TEXT NOT NULL,

                UNIQUE(meeting_id, member_id),

                FOREIGN KEY(meeting_id)

                    REFERENCES meetings(id)

                    ON DELETE CASCADE,

                FOREIGN KEY(member_id)

                    REFERENCES members(id)

                    ON DELETE CASCADE

            )

        `);

        console.log("Attendance table is ready.");


        /* =================================================
           SUBSCRIPTIONS
           ================================================= */

        await pool.query(`

            CREATE TABLE IF NOT EXISTS subscriptions (

                id SERIAL PRIMARY KEY,

                member_id INTEGER NOT NULL,

                amount NUMERIC(12,2) NOT NULL,

                payment_date TEXT NOT NULL,

                payment_method TEXT NOT NULL DEFAULT 'Cash',

                status TEXT NOT NULL DEFAULT 'Paid',

                notes TEXT,

                FOREIGN KEY(member_id)

                    REFERENCES members(id)

                    ON DELETE CASCADE

            )

        `);

        console.log("Subscriptions table is ready.");


        /* =================================================
           NOTIFICATIONS
           ================================================= */

        await pool.query(`

            CREATE TABLE IF NOT EXISTS notifications (

                id SERIAL PRIMARY KEY,

                title TEXT NOT NULL,

                message TEXT NOT NULL,

                created_at TEXT NOT NULL,

                created_by INTEGER,

                FOREIGN KEY(created_by)

                    REFERENCES members(id)

                    ON DELETE SET NULL

            )

        `);

        console.log("Notifications table is ready.");


        console.log(
            "======================================"
        );

        console.log(
            "French Club PostgreSQL database initialized."
        );

        console.log(
            "======================================"
        );


    }

    catch (error) {

        console.error(
            "Database initialization error:",
            error
        );

    }

}


/* =====================================================
   INITIALIZE ADMIN
   ===================================================== */

async function initializeAdmin() {

    try {

        const adminPassword =
            process.env.ADMIN_PASSWORD ||
            "Admin123456";


        const hashedPassword =
            await bcrypt.hash(
                adminPassword,
                10
            );


        const result =
            await pool.query(

                `
                SELECT id
                FROM members
                WHERE gr_number = $1
                `,

                ["AQ090"]

            );


        if (result.rows.length > 0) {

            await pool.query(

                `
                UPDATE members

                SET
                    role = 'admin',
                    status = 'Active',
                    password = $1

                WHERE gr_number = $2
                `,

                [
                    hashedPassword,
                    "AQ090"
                ]

            );


            console.log(
                "Admin AQ090 is ready."
            );

            return;

        }


        await pool.query(

            `
            INSERT INTO members
            (
                name,
                gr_number,
                class_name,
                phone,
                email,
                password,
                date_joined,
                status,
                role
            )

            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9
            )
            `,

            [
                "Musa Drammeh",
                "AQ090",
                "Grade 12",
                "0000000",
                null,
                hashedPassword,
                new Date().toISOString(),
                "Active",
                "admin"
            ]

        );


        console.log(
            "Admin AQ090 created successfully."
        );

    }

    catch (error) {

        console.error(
            "Admin initialization error:",
            error
        );

    }

}


/* =====================================================
   START DATABASE INITIALIZATION
   ===================================================== */

initializeDatabase()
    .then(function () {

        return initializeAdmin();

    })
    .catch(function (error) {

        console.error(
            "Database startup error:",
            error
        );

    });


/* =====================================================
   SQLITE-COMPATIBLE DATABASE INTERFACE
   ===================================================== */

/*
   The existing server.js uses:

   db.get()
   db.all()
   db.run()

   The functions below allow us to migrate the
   database without rewriting the entire server
   immediately.
*/


function convertPlaceholders(sql) {

    let parameterNumber = 0;

    return sql.replace(
        /\?/g,
        function () {

            parameterNumber++;

            return "$" + parameterNumber;

        }
    );

}


/* =====================================================
   db.get()
   ===================================================== */

function get(sql, parameters, callback) {

    const postgresSQL =
        convertPlaceholders(sql);


    pool.query(
        postgresSQL,
        parameters || [],
        function (error, result) {

            if (error) {

                return callback(
                    error
                );

            }


            const row =
                result.rows.length > 0
                    ? result.rows[0]
                    : undefined;


            callback(
                null,
                row
            );

        }
    );

}


/* =====================================================
   db.all()
   ===================================================== */

function all(sql, parameters, callback) {

    const postgresSQL =
        convertPlaceholders(sql);


    pool.query(
        postgresSQL,
        parameters || [],
        function (error, result) {

            if (error) {

                return callback(
                    error
                );

            }


            callback(
                null,
                result.rows
            );

        }
    );

}


/* =====================================================
   db.run()
   ===================================================== */

function run(sql, parameters, callback) {

    const postgresSQL =
        convertPlaceholders(sql);


    pool.query(
        postgresSQL,
        parameters || [],
        function (error, result) {

            if (error) {

                return callback.call(
                    {
                        changes: 0,
                        lastID: undefined
                    },
                    error
                );

            }


            const context = {

                changes:
                    result.rowCount || 0,

                lastID:
                    result.rows &&
                    result.rows[0]
                        ? result.rows[0].id
                        : undefined

            };


            if (callback) {

                callback.call(
                    context,
                    null
                );

            }

        }
    );

}


/* =====================================================
   EXPORT DATABASE
   ===================================================== */

module.exports = {

    get,

    all,

    run,

    query:
        pool.query.bind(pool),

    pool

};