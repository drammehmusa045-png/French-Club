const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

const databasePath = path.join(__dirname, "frenchclub.db");

console.log("======================================");
console.log("DATABASE LOCATION:");
console.log(databasePath);
console.log("======================================");

const db = new sqlite3.Database(databasePath, function (error) {

    if (error) {

        console.error(
            "Database connection failed:",
            error.message
        );

        return;
    }

    console.log(
        "French Club database connected successfully."
    );

});


/* =====================================================
   ENABLE FOREIGN KEYS
   ===================================================== */

db.run(`
    PRAGMA foreign_keys = ON
`);


/* =====================================================
   MEMBERS TABLE
   ===================================================== */

db.run(`
    CREATE TABLE IF NOT EXISTS members (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

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
`, function (error) {

    if (error) {

        console.error(
            "Error creating members table:",
            error.message
        );

        return;
    }

    console.log("Members table is ready.");

    initializeAdmin();

});


/* =====================================================
   ADMIN INITIALIZATION
   ===================================================== */

async function initializeAdmin() {

    try {

        const adminPassword =
            process.env.ADMIN_PASSWORD || "Admin123456";

        const hashedPassword =
            await bcrypt.hash(adminPassword, 10);

        db.get(
            `
            SELECT id
            FROM members
            WHERE gr_number = ?
            `,
            ["AQ090"],
            function (error, member) {

                if (error) {

                    console.error(
                        "Admin lookup error:",
                        error.message
                    );

                    return;
                }

                if (member) {

                    db.run(
                        `
                        UPDATE members
                        SET role = 'admin',
                            status = 'Active',
                            password = ?
                        WHERE gr_number = ?
                        `,
                        [hashedPassword, "AQ090"],
                        function (updateError) {

                            if (updateError) {

                                console.error(
                                    "Admin update error:",
                                    updateError.message
                                );

                                return;
                            }

                            console.log(
                                "Admin AQ090 is ready."
                            );

                        }
                    );

                    return;
                }

                db.run(
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
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    ],
                    function (insertError) {

                        if (insertError) {

                            console.error(
                                "Admin creation error:",
                                insertError.message
                            );

                            return;
                        }

                        console.log(
                            "Admin AQ090 created successfully."
                        );

                    }
                );

            }
        );

    } catch (error) {

        console.error(
            "Admin initialization error:",
            error.message
        );

    }

}


/* =====================================================
   ADD MISSING MEMBERS COLUMNS
   ===================================================== */

db.all(
    `PRAGMA table_info(members)`,
    [],
    function (error, columns) {

        if (error) {

            console.error(
                "Unable to inspect members table:",
                error.message
            );

            return;
        }

        const columnNames =
            (columns || []).map(
                column => column.name
            );


        if (!columnNames.includes("role")) {

            db.run(
                `
                ALTER TABLE members
                ADD COLUMN role TEXT NOT NULL DEFAULT 'member'
                `,
                function (alterError) {

                    if (alterError) {

                        console.error(
                            "Error adding role column:",
                            alterError.message
                        );

                    }
                    else {

                        console.log(
                            "Members role column added."
                        );

                    }

                }
            );

        }


        if (!columnNames.includes("profile_picture")) {

            db.run(
                `
                ALTER TABLE members
                ADD COLUMN profile_picture TEXT
                `,
                function (alterError) {

                    if (alterError) {

                        console.error(
                            "Error adding profile_picture column:",
                            alterError.message
                        );

                    }
                    else {

                        console.log(
                            "Members profile_picture column added."
                        );

                    }

                }
            );

        }

    }
);


/* =====================================================
   MEETINGS TABLE
   ===================================================== */

db.run(`
    CREATE TABLE IF NOT EXISTS meetings (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        title TEXT NOT NULL,

        meeting_date TEXT NOT NULL,

        description TEXT,

        created_at TEXT NOT NULL

    )
`, function (error) {

    if (error) {

        console.error(
            "Error creating meetings table:",
            error.message
        );

        return;
    }

    console.log("Meetings table is ready.");

});


/* =====================================================
   ATTENDANCE TABLE
   ===================================================== */

db.run(`
    CREATE TABLE IF NOT EXISTS attendance (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

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
`, function (error) {

    if (error) {

        console.error(
            "Error creating attendance table:",
            error.message
        );

        return;
    }

    console.log("Attendance table is ready.");

});


/* =====================================================
   SUBSCRIPTIONS / PAYMENTS TABLE
   ===================================================== */

db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        member_id INTEGER NOT NULL,

        amount REAL NOT NULL,

        payment_date TEXT NOT NULL,

        payment_method TEXT NOT NULL DEFAULT 'Cash',

        status TEXT NOT NULL DEFAULT 'Paid',

        notes TEXT,

        FOREIGN KEY(member_id)
            REFERENCES members(id)
            ON DELETE CASCADE

    )
`, function (error) {

    if (error) {

        console.error(
            "Error creating subscriptions table:",
            error.message
        );

        return;
    }

    console.log("Subscriptions table is ready.");

});


/* =====================================================
   NOTIFICATIONS TABLE
   ===================================================== */

db.run(`
    CREATE TABLE IF NOT EXISTS notifications (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        title TEXT NOT NULL,

        message TEXT NOT NULL,

        created_at TEXT NOT NULL

    )
`, function (error) {

    if (error) {

        console.error(
            "Error creating notifications table:",
            error.message
        );

        return;
    }

    console.log("Notifications table is ready.");

});


/* =====================================================
   EXPORT DATABASE
   ===================================================== */

module.exports = db;
