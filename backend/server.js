const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const db = require("../database/database");

const app = express();
const PORT = 3000;


/* =====================================================
   ADMIN API SECURITY
   ===================================================== */

function requireAdmin(req, res, next) {

    const grNumber =
        String(
            req.headers["x-admin-gr"] || ""
        ).trim();

    if (!grNumber) {

        return res.status(401).json({
            message:
                "Administrator login required."
        });

    }

    db.get(
        `
        SELECT
            id,
            role,
            status
        FROM members
        WHERE gr_number = ?
        `,
        [grNumber],

        function (error, member) {

            if (error) {

                console.error(
                    "Admin security database error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Security verification failed."
                });

            }

            if (
                !member ||
                member.role !== "admin" ||
                member.status !== "Active"
            ) {

                return res.status(403).json({
                    message:
                        "Administrator privileges are required."
                });

            }

            next();

        }
    );

}


/* =====================================================
   MIDDLEWARE
   ===================================================== */

app.use(cors());

app.use(
    express.json({
        limit: "5mb"
    })
);

/* =====================================================
   TEMPORARY ADMIN PASSWORD RESET
   REMOVE THIS SECTION AFTER USE
   ===================================================== */

app.post(
    "/api/temp-admin-reset",
    async function (req, res) {

        try {

            const resetSecret =
                String(req.headers["x-reset-secret"] || "").trim();

            const expectedSecret =
                String(process.env.ADMIN_RESET_SECRET || "").trim();

            if (
                !expectedSecret ||
                resetSecret !== expectedSecret
            ) {

                return res.status(403).json({
                    message: "Unauthorized."
                });

            }

            const grNumber =
                String(req.body.grNumber || "").trim();

            const newPassword =
                String(req.body.newPassword || "");

            if (!grNumber || !newPassword) {

                return res.status(400).json({
                    message:
                        "GR number and new password are required."
                });

            }

            if (newPassword.length < 6) {

                return res.status(400).json({
                    message:
                        "Password must be at least 6 characters."
                });

            }

            const hashedPassword =
                await bcrypt.hash(
                    newPassword,
                    10
                );

            db.run(
                `
                UPDATE members
                SET password = ?
                WHERE gr_number = ?
                `,
                [
                    hashedPassword,
                    grNumber
                ],
                function (error) {

                    if (error) {

                        console.error(
                            "Temporary admin reset error:",
                            error
                        );

                        return res.status(500).json({
                            message:
                                "Database error."
                        });

                    }

                    if (this.changes === 0) {

                        return res.status(404).json({
                            message:
                                "Member not found."
                        });

                    }

                    console.log(
                        "Temporary password reset used for:",
                        grNumber
                    );

                    return res.status(200).json({
                        message:
                            "Password reset successfully."
                    });

                }
            );

        }

        catch (error) {

            console.error(
                "Temporary admin reset error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to reset password."
            });

        }

    }
);

/* =====================================================
   FRONTEND
   ===================================================== */

const frontendPath = path.join(
    __dirname,
    "..",
    "frontend"
);

console.log(
    "Frontend path:",
    frontendPath
);

app.use(
    express.static(frontendPath)
);

app.use(
    "/profile-pictures",
    express.static(
        path.join(
            __dirname,
            "profile-pictures"
        )
    )
);


/* =====================================================
   HOME
   ===================================================== */

app.get(
    "/",
    function (req, res) {

        res.sendFile(
            path.join(
                frontendPath,
                "index.html"
            )
        );

    }
);


/* =====================================================
   API TEST
   ===================================================== */

app.get(
    "/api",
    function (req, res) {

        res.json({
            message:
                "French Club Management System API is running."
        });

    }
);


/* =====================================================
   MEMBER / ADMIN LOGIN
   ===================================================== */
/* =====================================================
   MEMBER / ADMIN LOGIN
   ===================================================== */

app.post(
    "/api/auth/login",
    async function (req, res) {

        try {

            const grNumber =
                String(
                    req.body.grNumber || ""
                ).trim();

            const password =
                String(
                    req.body.password || ""
                );


            if (
                !grNumber ||
                !password
            ) {

                return res.status(400).json({
                    message:
                        "Please enter your GR number and password."
                });

            }


            db.get(
                `
                SELECT *
                FROM members
                WHERE gr_number = ?
                `,
                [grNumber],

                async function (
                    error,
                    member
                ) {

                    if (error) {

                        console.error(
                            "Login database error:",
                            error
                        );

                        return res.status(500).json({
                            message:
                                "Database error."
                        });

                    }


                    if (!member) {

                        return res.status(401).json({
                            message:
                                "Invalid GR number or password."
                        });

                    }


                    try {

                        const passwordCorrect =
                            await bcrypt.compare(
                                password,
                                member.password
                            );


                        if (!passwordCorrect) {

                            return res.status(401).json({
                                message:
                                    "Invalid GR number or password."
                            });

                        }


                        delete member.password;


                        return res.status(200).json({

                            message:
                                "Login successful.",

                            member:
                                member,

                            role:
                                member.role || "member"

                        });

                    }

                    catch (passwordError) {

                        console.error(
                            "Password verification error:",
                            passwordError
                        );

                        return res.status(500).json({
                            message:
                                "Password verification failed."
                        });

                    }

                }
            );

        }

        catch (error) {

            console.error(
                "Login server error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error."
            });

        }

    }
);


/* =====================================================
   ADMIN - GET ALL MEMBERS
   ===================================================== */

app.get(
    "/api/admin/members",
    requireAdmin,
    function (req, res) {

        db.all(
            `
            SELECT
                id,
                name,
                gr_number,
                class_name,
                phone,
                email,
                date_joined,
                status,
                role
            FROM members
            ORDER BY id DESC
            `,

            [],

            function (
                error,
                members
            ) {

                if (error) {

                    console.error(
                        "Error loading members:",
                        error
                    );

                    return res.status(500).json({
                        message:
                            "Unable to load members."
                    });

                }


                return res.status(200).json({

                    members:
                        members || []

                });

            }
        );

    }
);

/* =====================================================
   ADMIN - EDIT MEMBER
   ===================================================== */

app.put(
    "/api/admin/members/:id",
    requireAdmin,
    function (req, res) {

        const memberId =
            Number(req.params.id);

        const name =
            String(req.body.name || "").trim();

        const grNumber =
            String(req.body.grNumber || "").trim();

        const className =
            String(req.body.className || "").trim();

        const phone =
            String(req.body.phone || "").trim();

        const email =
            String(req.body.email || "").trim();

        const status =
            String(req.body.status || "Active").trim();


        if (
            !Number.isInteger(memberId) ||
            memberId <= 0
        ) {

            return res.status(400).json({
                message:
                    "Invalid member ID."
            });

        }


        if (
            !name ||
            !grNumber ||
            !className ||
            !phone
        ) {

            return res.status(400).json({
                message:
                    "Please complete all required member fields."
            });

        }


        if (
            status !== "Active" &&
            status !== "Inactive"
        ) {

            return res.status(400).json({
                message:
                    "Invalid member status."
            });

        }


        db.get(
            `
            SELECT
                id,
                role
            FROM members
            WHERE id = ?
            `,
            [memberId],

            function (
                error,
                member
            ) {

                if (error) {

                    console.error(
                        "Find member for edit error:",
                        error
                    );

                    return res.status(500).json({
                        message:
                            "Database error."
                    });

                }


                if (!member) {

                    return res.status(404).json({
                        message:
                            "Member not found."
                    });

                }


                if (
                    member.role === "admin"
                ) {

                    return res.status(403).json({
                        message:
                            "Administrators cannot be edited from the member management section."
                    });

                }


                db.get(
                    `
                    SELECT
                        id
                    FROM members
                    WHERE
                        gr_number = ?
                        AND id != ?
                    `,
                    [
                        grNumber,
                        memberId
                    ],

                    function (
                        duplicateError,
                        duplicate
                    ) {

                        if (duplicateError) {

                            console.error(
                                "Check duplicate GR number error:",
                                duplicateError
                            );

                            return res.status(500).json({
                                message:
                                    "Database error."
                            });

                        }


                        if (duplicate) {

                            return res.status(409).json({
                                message:
                                    "This GR number is already registered to another member."
                            });

                        }


                        db.run(
                            `
                            UPDATE members

                            SET
                                name = ?,
                                gr_number = ?,
                                class_name = ?,
                                phone = ?,
                                email = ?,
                                status = ?

                            WHERE id = ?
                            `,

                            [
                                name,
                                grNumber,
                                className,
                                phone,
                                email || null,
                                status,
                                memberId
                            ],

                            function (
                                updateError
                            ) {

                                if (updateError) {

                                    console.error(
                                        "Update member error:",
                                        updateError
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Unable to update member."
                                    });

                                }


                                return res.status(200).json({

                                    message:
                                        "Member information updated successfully."

                                });

                            }
                        );

                    }
                );

            }
        );

    }
);

/* =====================================================
   ADMIN - RESET MEMBER PASSWORD
   ===================================================== */

app.post(
    "/api/admin/members/:id/reset-password",
    requireAdmin,
    async function (req, res) {

        try {

            const memberId =
                Number(req.params.id);

            const newPassword =
                String(
                    req.body.newPassword || ""
                );


            if (
                !Number.isInteger(memberId) ||
                memberId <= 0
            ) {

                return res.status(400).json({
                    message:
                        "Invalid member ID."
                });

            }


            if (!newPassword) {

                return res.status(400).json({
                    message:
                        "Please enter a new password."
                });

            }


            if (newPassword.length < 6) {

                return res.status(400).json({
                    message:
                        "Password must be at least 6 characters."
                });

            }


            db.get(
                `
                SELECT
                    id,
                    name,
                    gr_number,
                    role,
                    status
                FROM members
                WHERE id = ?
                `,
                [memberId],

                async function (
                    error,
                    member
                ) {

                    if (error) {

                        console.error(
                            "Find member for password reset error:",
                            error
                        );

                        return res.status(500).json({
                            message:
                                "Database error."
                        });

                    }


                    if (!member) {

                        return res.status(404).json({
                            message:
                                "Member not found."
                        });

                    }


                    if (
                        member.role === "admin"
                    ) {

                        return res.status(403).json({
                            message:
                                "Administrator passwords cannot be reset from the member management section."
                        });

                    }


                    try {

                        const hashedPassword =
                            await bcrypt.hash(
                                newPassword,
                                10
                            );


                        db.run(
                            `
                            UPDATE members
                            SET password = ?
                            WHERE id = ?
                            `,

                            [
                                hashedPassword,
                                memberId
                            ],

                            function (
                                updateError
                            ) {

                                if (updateError) {

                                    console.error(
                                        "Password reset database error:",
                                        updateError
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Unable to reset member password."
                                    });

                                }


                                if (
                                    this.changes === 0
                                ) {

                                    return res.status(404).json({
                                        message:
                                            "Member not found."
                                    });

                                }


                                console.log(
                                    "Admin reset password for member:",
                                    member.name,
                                    "(" + member.gr_number + ")"
                                );


                                return res.status(200).json({

                                    message:
                                        "Member password reset successfully.",

                                    memberId:
                                        member.id,

                                    grNumber:
                                        member.gr_number

                                });

                            }
                        );

                    }

                    catch (passwordError) {

                        console.error(
                            "Password hashing error:",
                            passwordError
                        );

                        return res.status(500).json({
                            message:
                                "Unable to reset password."
                        });

                    }

                }
            );

        }

        catch (error) {

            console.error(
                "Admin password reset error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error."
            });

        }

    }
);


/* =====================================================
   ADMIN - REMOVE MEMBER
   ===================================================== */

app.delete(
    "/api/admin/members/:id",
    requireAdmin,
    function (req, res) {

        const memberId =
            Number(req.params.id);


        if (
            !Number.isInteger(memberId) ||
            memberId <= 0
        ) {

            return res.status(400).json({
                message:
                    "Invalid member ID."
            });

        }


        db.get(
            `
            SELECT
                id,
                name,
                role
            FROM members
            WHERE id = ?
            `,
            [memberId],

            function (
                error,
                member
            ) {

                if (error) {

                    console.error(
                        "Error finding member:",
                        error
                    );

                    return res.status(500).json({
                        message:
                            "Unable to find member."
                    });

                }


                if (!member) {

                    return res.status(404).json({
                        message:
                            "Member not found."
                    });

                }


                if (
                    member.role === "admin"
                ) {

                    return res.status(403).json({
                        message:
                            "Administrators cannot be removed."
                    });

                }


                db.run(
                    `
                    DELETE FROM attendance
                    WHERE member_id = ?
                    `,
                    [memberId],

                    function (attendanceError) {

                        if (attendanceError) {

                            console.error(
                                "Error deleting attendance:",
                                attendanceError
                            );

                            return res.status(500).json({
                                message:
                                    "Unable to remove member attendance records."
                            });

                        }


                        db.run(
                            `
                            DELETE FROM subscriptions
                            WHERE member_id = ?
                            `,
                            [memberId],

                            function (
                                paymentError
                            ) {

                                if (paymentError) {

                                    console.error(
                                        "Error deleting payments:",
                                        paymentError
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Unable to remove member payment records."
                                    });

                                }


                                db.run(
                                    `
                                    DELETE FROM members
                                    WHERE id = ?
                                    `,
                                    [memberId],

                                    function (
                                        deleteError
                                    ) {

                                        if (deleteError) {

                                            console.error(
                                                "Error deleting member:",
                                                deleteError
                                            );

                                            return res.status(500).json({
                                                message:
                                                    "Unable to remove member."
                                            });

                                        }


                                        if (
                                            this.changes === 0
                                        ) {

                                            return res.status(404).json({
                                                message:
                                                    "Member not found."
                                            });

                                        }


                                        console.log(
                                            "Member removed:",
                                            member.name,
                                            "(ID:",
                                            member.id,
                                            ")"
                                        );


                                        return res.status(200).json({

                                            message:
                                                "Member removed successfully.",

                                            memberId:
                                                member.id

                                        });

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    }
);


/* =====================================================
   ADMIN - GET MEETINGS
   ===================================================== */

app.get(
    "/api/admin/meetings",
    requireAdmin,
    function (req, res) {

        db.all(
            `
            SELECT
                id,
                title,
                meeting_date,
                description,
                created_at
            FROM meetings
            ORDER BY meeting_date DESC, id DESC
            `,

            [],

            function (
                error,
                meetings
            ) {

                if (error) {

                    console.error(
                        "Error loading meetings:",
                        error
                    );

                    return res.status(500).json({

                        message:
                            "Unable to load meetings.",

                        error:
                            error.message

                    });

                }


                return res.status(200).json({

                    meetings:
                        meetings || []

                });

            }
        );

    }
);


/* =====================================================
   ADMIN - CREATE MEETING
   ===================================================== */

app.post(
    "/api/admin/meetings",
    requireAdmin,
    function (req, res) {

        const title =
            String(
                req.body.title || ""
            ).trim();

        const meetingDate =
            String(
                req.body.meetingDate || ""
            ).trim();

        const description =
            req.body.description
                ? String(
                    req.body.description
                ).trim()
                : null;


        if (
            !title ||
            !meetingDate
        ) {

            return res.status(400).json({

                message:
                    "Meeting title and date are required."

            });

        }


        db.run(
            `
            INSERT INTO meetings
            (
                title,
                meeting_date,
                description,
                created_at
            )
            VALUES (?, ?, ?, ?)
            `,

            [
                title,
                meetingDate,
                description,
                new Date().toISOString()
            ],

            function (error) {

                if (error) {

                    console.error(
                        "Error creating meeting:",
                        error
                    );

                    return res.status(500).json({

                        message:
                            "Unable to create meeting.",

                        error:
                            error.message

                    });

                }


                const meetingId =
                    this.lastID;


                db.run(
                    `
                    INSERT INTO notifications
                    (
                        title,
                        message,
                        created_at
                    )
                    VALUES (?, ?, ?)
                    `,

                    [
                        "New Meeting",
                        `A new French Club meeting has been scheduled: ${title}.`,
                        new Date().toISOString()
                    ],

                    function (
                        notificationError
                    ) {

                        if (notificationError) {

                            console.error(
                                "Meeting notification error:",
                                notificationError
                            );

                        }


                        return res.status(201).json({

                            message:
                                "Meeting created successfully.",

                            meetingId:
                                meetingId

                        });

                    }
                );

            }
        );

    }
);


/* =====================================================
   ADMIN - EDIT MEETING
   ===================================================== */

app.put(
    "/api/admin/meetings/:meetingId",
    requireAdmin,
    function (req, res) {

        const meetingId =
            Number(
                req.params.meetingId
            );

        const title =
            String(
                req.body.title || ""
            ).trim();

        const meetingDate =
            String(
                req.body.meetingDate || ""
            ).trim();

        const description =
            String(
                req.body.description || ""
            ).trim();


        if (
            !Number.isInteger(meetingId) ||
            meetingId <= 0
        ) {

            return res.status(400).json({
                message:
                    "Invalid meeting ID."
            });

        }


        if (
            !title ||
            !meetingDate
        ) {

            return res.status(400).json({
                message:
                    "Meeting title and date are required."
            });

        }


        db.run(
            `
            UPDATE meetings
            SET
                title = ?,
                meeting_date = ?,
                description = ?
            WHERE id = ?
            `,

            [
                title,
                meetingDate,
                description || null,
                meetingId
            ],

            function (error) {

                if (error) {

                    console.error(
                        "Error updating meeting:",
                        error
                    );

                    return res.status(500).json({

                        message:
                            "Unable to update meeting.",

                        error:
                            error.message

                    });

                }


                if (
                    this.changes === 0
                ) {

                    return res.status(404).json({
                        message:
                            "Meeting not found."
                    });

                }


                console.log(
                    "Meeting updated:",
                    meetingId
                );


                return res.status(200).json({

                    message:
                        "Meeting updated successfully.",

                    meetingId:
                        meetingId

                });

            }
        );

    }
);


/* =====================================================
   ADMIN - DELETE MEETING
   ===================================================== */

app.delete(
    "/api/admin/meetings/:meetingId",
    requireAdmin,
    function (req, res) {

        const meetingId =
            Number(
                req.params.meetingId
            );


        if (
            !Number.isInteger(meetingId) ||
            meetingId <= 0
        ) {

            return res.status(400).json({
                message:
                    "Invalid meeting ID."
            });

        }


        db.get(
            `
            SELECT
                id,
                title
            FROM meetings
            WHERE id = ?
            `,

            [meetingId],

            function (
                findError,
                meeting
            ) {

                if (findError) {

                    console.error(
                        "Error finding meeting:",
                        findError
                    );

                    return res.status(500).json({

                        message:
                            "Unable to find meeting.",

                        error:
                            findError.message

                    });

                }


                if (!meeting) {

                    return res.status(404).json({
                        message:
                            "Meeting not found."
                    });

                }


                /*
                 * Delete attendance records first.
                 */

                db.run(
                    `
                    DELETE FROM attendance
                    WHERE meeting_id = ?
                    `,

                    [meetingId],

                    function (attendanceError) {

                        if (attendanceError) {

                            console.error(
                                "Error deleting meeting attendance:",
                                attendanceError
                            );

                            return res.status(500).json({

                                message:
                                    "Unable to delete meeting attendance.",

                                error:
                                    attendanceError.message

                            });

                        }


                        /*
                         * Delete the meeting.
                         */

                        db.run(
                            `
                            DELETE FROM meetings
                            WHERE id = ?
                            `,

                            [meetingId],

                            function (deleteError) {

                                if (deleteError) {

                                    console.error(
                                        "Error deleting meeting:",
                                        deleteError
                                    );

                                    return res.status(500).json({

                                        message:
                                            "Unable to delete meeting.",

                                        error:
                                            deleteError.message

                                    });

                                }


                                if (
                                    this.changes === 0
                                ) {

                                    return res.status(404).json({
                                        message:
                                            "Meeting not found."
                                    });

                                }


                                console.log(
                                    "Meeting deleted:",
                                    meeting.title,
                                    "(ID:",
                                    meeting.id,
                                    ")"
                                );


                                return res.status(200).json({

                                    message:
                                        "Meeting deleted successfully.",

                                    meetingId:
                                        meetingId,

                                    title:
                                        meeting.title

                                });

                            }
                        );

                    }
                );

            }
        );

    }
);


/* =====================================================
   ATTENDANCE - GET MEMBERS
   ===================================================== */

app.get(
    "/api/admin/meetings/:meetingId/attendance",
    requireAdmin,
    function (req, res) {

        const meetingId =
            Number(
                req.params.meetingId
            );


        if (
            !Number.isInteger(meetingId) ||
            meetingId <= 0
        ) {

            return res.status(400).json({
                message:
                    "Invalid meeting ID."
            });

        }


        db.all(
            `
            SELECT

                members.id,
                members.name,
                members.gr_number,
                members.class_name,

                COALESCE(
                    attendance.status,
                    'Absent'
                ) AS attendance_status

            FROM members

            LEFT JOIN attendance

                ON members.id =
                   attendance.member_id

                AND attendance.meeting_id = ?

            ORDER BY members.id ASC
            `,

            [meetingId],

            function (
                error,
                members
            ) {

                if (error) {

                    console.error(
                        "Error loading attendance:",
                        error
                    );

                    return res.status(500).json({

                        message:
                            "Unable to load attendance.",

                        error:
                            error.message

                    });

                }


                return res.status(200).json({

                    members:
                        members || []

                });

            }
        );

    }
);


/* =====================================================
   ATTENDANCE - SAVE
   ===================================================== */

app.post(
    "/api/admin/meetings/:meetingId/attendance",
    requireAdmin,
    function (req, res) {

        const meetingId =
            Number(
                req.params.meetingId
            );

        const memberId =
            Number(
                req.body.memberId
            );

        const status =
            req.body.status;


        if (
            !Number.isInteger(meetingId) ||
            meetingId <= 0
        ) {

            return res.status(400).json({
                message:
                    "Invalid meeting ID."
            });

        }


        if (
            !Number.isInteger(memberId) ||
            memberId <= 0
        ) {

            return res.status(400).json({
                message:
                    "Invalid member ID."
            });

        }


        if (
            status !== "Present" &&
            status !== "Absent"
        ) {

            return res.status(400).json({
                message:
                    "Attendance status must be Present or Absent."
            });

        }


        db.run(
            `
            INSERT INTO attendance
            (
                meeting_id,
                member_id,
                status,
                marked_at
            )
            VALUES (?, ?, ?, ?)

            ON CONFLICT(meeting_id, member_id)

            DO UPDATE SET

                status = excluded.status,
                marked_at = excluded.marked_at
            `,

            [
                meetingId,
                memberId,
                status,
                new Date().toISOString()
            ],

            function (error) {

                if (error) {

                    console.error(
                        "Error saving attendance:",
                        error
                    );

                    return res.status(500).json({

                        message:
                            "Unable to save attendance.",

                        error:
                            error.message

                    });

                }


                return res.status(200).json({

                    message:
                        "Attendance saved successfully."

                });

            }
        );

    }
);


/* =====================================================
   ATTENDANCE COUNT
   ===================================================== */

app.get(
    "/api/admin/attendance/count",
    requireAdmin,
    function (req, res) {

        db.get(
            `
            SELECT
                COUNT(*) AS total
            FROM attendance
            WHERE status = 'Present'
            `,

            [],

            function (
                error,
                result
            ) {

                if (error) {

                    console.error(
                        "Error loading attendance count:",
                        error
                    );

                    return res.status(500).json({
                        message:
                            "Unable to load attendance."
                    });

                }


                return res.status(200).json({

                    count:
                        result
                            ? result.total
                            : 0

                });

            }
        );

    }
);


/* =====================================================
   ADMIN - GET ALL PAYMENTS
   ===================================================== */

app.get(
    "/api/admin/subscriptions",
    requireAdmin,
    function (req, res) {

        db.all(
            `
            SELECT
                subscriptions.id,
                subscriptions.member_id,
                members.name,
                members.gr_number,
                members.class_name,
                subscriptions.amount,
                subscriptions.payment_date,
                subscriptions.payment_method,
                subscriptions.status,
                subscriptions.notes

            FROM subscriptions

            LEFT JOIN members
                ON subscriptions.member_id =
                   members.id

            ORDER BY
                subscriptions.payment_date DESC
            `,

            [],

            function (
                error,
                rows
            ) {

                if (error) {

                    console.error(
                        "Error loading subscriptions:",
                        error
                    );

                    return res.status(500).json({
                        message:
                            "Unable to load subscriptions."
                    });

                }


                return res.status(200).json({

                    subscriptions:
                        rows || []

                });

            }
        );

    }
);


/* =====================================================
   ADMIN - GET PAYMENT MEMBERS
   ===================================================== */

app.get(
    "/api/admin/payment-members",
    requireAdmin,
    function (req, res) {

        db.all(
            `
            SELECT
                id,
                name,
                gr_number,
                class_name
            FROM members
            WHERE role = 'member'
            ORDER BY name ASC
            `,

            [],

            function (
                error,
                members
            ) {

                if (error) {

                    console.error(
                        "Payment members error:",
                        error
                    );

                    return res.status(500).json({
                        message:
                            "Unable to load payment members."
                    });

                }


                return res.status(200).json({

                    members:
                        members || []

                });

            }
        );

    }
);


/* =====================================================
   ADMIN - SAVE PAYMENT
   ===================================================== */

app.post(
    "/api/admin/subscriptions",
    requireAdmin,
    function (req, res) {

        const {
            memberId,
            amount,
            paymentDate,
            paymentMethod,
            status,
            notes
        } = req.body;


        if (!memberId) {

            return res.status(400).json({
                message:
                    "Member is required."
            });

        }


        if (
            !amount ||
            Number(amount) <= 0
        ) {

            return res.status(400).json({
                message:
                    "A valid payment amount is required."
            });

        }


        if (!paymentDate) {

            return res.status(400).json({
                message:
                    "Payment date is required."
            });

        }


        db.run(
            `
            INSERT INTO subscriptions
            (
                member_id,
                amount,
                payment_date,
                payment_method,
                status,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,

            [
                memberId,
                Number(amount),
                paymentDate,
                paymentMethod || "Cash",
                status || "Paid",
                notes || null
            ],

            function (error) {

                if (error) {

                    console.error(
                        "Error saving payment:",
                        error
                    );

                    return res.status(500).json({
                        message:
                            "Unable to save payment."
                    });

                }


                return res.status(201).json({

                    message:
                        "Payment saved successfully.",

                    paymentId:
                        this.lastID

                });

            }
        );

    }
);


/* =====================================================
   ADMIN - PAYMENT TOTAL
   ===================================================== */

app.get(
    "/api/admin/subscriptions/total",
    requireAdmin,
    function (req, res) {

        db.get(
            `
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS total

            FROM subscriptions

            WHERE status = 'Paid'
            `,

            [],

            function (
                error,
                result
            ) {

                if (error) {

                    console.error(
                        "Error loading payment total:",
                        error
                    );

                    return res.status(500).json({
                        message:
                            "Unable to load payment total."
                    });

                }


                return res.status(200).json({

                    total:
                        result
                            ? result.total
                            : 0

                });

            }
        );

    }
);


/* =====================================================
   MEMBER - GET OWN PROFILE
   ===================================================== */

app.get(
    "/api/member/profile/:grNumber",
    function (req, res) {

        const grNumber =
            String(
                req.params.grNumber || ""
            ).trim();


        db.get(
            `
            SELECT
                id,
                name,
                gr_number,
                class_name,
                phone,
                email,
                date_joined,
                status,
                role,
                profile_picture
            FROM members
            WHERE gr_number = ?
            `,

            [grNumber],

            function (
                error,
                member
            ) {

                if (error) {

                    console.error(
                        "Member profile error:",
                        error
                    );

                    return res.status(500).json({
                        message:
                            "Unable to load profile."
                    });

                }


                if (!member) {

                    return res.status(404).json({
                        message:
                            "Member not found."
                    });

                }


                return res.status(200).json({
                    member:
                        member
                });

            }
        );

    }
);


/* =====================================================
   MEMBER - OWN ATTENDANCE
   ===================================================== */

app.get(
    "/api/member/attendance/:memberId",
    function (req, res) {

        const memberId =
            Number(
                req.params.memberId
            );


        db.all(
            `
            SELECT
                meetings.title,
                meetings.meeting_date,
                attendance.status,
                attendance.marked_at

            FROM attendance

            INNER JOIN meetings
                ON attendance.meeting_id =
                   meetings.id

            WHERE attendance.member_id = ?

            ORDER BY meetings.meeting_date DESC
            `,

            [memberId],

            function (
                error,
                attendance
            ) {

                if (error) {

                    console.error(
                        "Member attendance error:",
                        error
                    );

                    return res.status(500).json({
                        message:
                            "Unable to load attendance."
                    });

                }


                return res.status(200).json({

                    attendance:
                        attendance || []

                });

            }
        );

    }
);


/* =====================================================
   MEMBER - OWN PAYMENTS
   ===================================================== */

app.get(
    "/api/member/payments/:memberId",
    function (req, res) {

        const memberId =
            Number(
                req.params.memberId
            );


        db.all(
            `
            SELECT
                amount,
                payment_date,
                payment_method,
                status,
                notes

            FROM subscriptions

            WHERE member_id = ?

            ORDER BY payment_date DESC
            `,

            [memberId],

            function (
                error,
                payments
            ) {

                if (error) {

                    console.error(
                        "Member payments error:",
                        error
                    );

                    return res.status(500).json({
                        message:
                            "Unable to load payments."
                    });

                }


                return res.status(200).json({

                    payments:
                        payments || []

                });

            }
        );

    }
);


/* =====================================================
   MEMBER - CHANGE PASSWORD
   ===================================================== */

app.post(
    "/api/member/change-password",
    async function (req, res) {

        try {

            const memberId =
                Number(
                    req.body.memberId
                );

            const currentPassword =
                String(
                    req.body.currentPassword || ""
                );

            const newPassword =
                String(
                    req.body.newPassword || ""
                );


            if (
                !Number.isInteger(memberId) ||
                memberId <= 0
            ) {

                return res.status(400).json({
                    message:
                        "Invalid member."
                });

            }


            if (!currentPassword) {

                return res.status(400).json({
                    message:
                        "Please enter your current password."
                });

            }


            if (!newPassword) {

                return res.status(400).json({
                    message:
                        "Please enter a new password."
                });

            }


            if (newPassword.length < 6) {

                return res.status(400).json({
                    message:
                        "New password must be at least 6 characters."
                });

            }


            db.get(
                `
                SELECT
                    id,
                    password
                FROM members
                WHERE id = ?
                `,

                [memberId],

                async function (
                    error,
                    member
                ) {

                    if (error) {

                        console.error(
                            "Change password database error:",
                            error
                        );

                        return res.status(500).json({
                            message:
                                "Database error."
                        });

                    }


                    if (!member) {

                        return res.status(404).json({
                            message:
                                "Member not found."
                        });

                    }


                    try {

                        const passwordCorrect =
                            await bcrypt.compare(
                                currentPassword,
                                member.password
                            );


                        if (!passwordCorrect) {

                            return res.status(401).json({
                                message:
                                    "Current password is incorrect."
                            });

                        }


                        const hashedPassword =
                            await bcrypt.hash(
                                newPassword,
                                10
                            );


                        db.run(
                            `
                            UPDATE members
                            SET password = ?
                            WHERE id = ?
                            `,

                            [
                                hashedPassword,
                                memberId
                            ],

                            function (
                                updateError
                            ) {

                                if (updateError) {

                                    console.error(
                                        "Password update error:",
                                        updateError
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Unable to change password."
                                    });

                                }


                                return res.status(200).json({

                                    message:
                                        "Password changed successfully."

                                });

                            }
                        );

                    }

                    catch (passwordError) {

                        console.error(
                            "Password verification error:",
                            passwordError
                        );

                        return res.status(500).json({
                            message:
                                "Password verification failed."
                        });

                    }

                }
            );

        }

        catch (error) {

            console.error(
                "Change password server error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server error."
            });

        }

    }
);


/* =====================================================
   MEMBER - UPDATE PROFILE PICTURE
   ===================================================== */

app.post(
    "/api/member/profile-picture",
    async function (req, res) {

        try {

            const memberId =
                Number(
                    req.body.memberId
                );

            const image =
                String(
                    req.body.image || ""
                );


            if (
                !Number.isInteger(memberId) ||
                memberId <= 0
            ) {

                return res.status(400).json({
                    message:
                        "Invalid member."
                });

            }


            if (!image) {

                return res.status(400).json({
                    message:
                        "Please select a picture."
                });

            }


            if (
                !image.startsWith(
                    "data:image/"
                )
            ) {

                return res.status(400).json({
                    message:
                        "Invalid image."
                });

            }


            if (
                image.length >
                5 * 1024 * 1024
            ) {

                return res.status(400).json({
                    message:
                        "Picture is too large. Please choose a smaller picture."
                });

            }


            const match =
                image.match(
                    /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/
                );


            if (!match) {

                return res.status(400).json({
                    message:
                        "Please use a JPG, PNG, or WebP picture."
                });

            }


            const extension =
                match[1] === "jpeg"
                    ? "jpg"
                    : match[1];


            const imageData =
                match[2];


            const buffer =
                Buffer.from(
                    imageData,
                    "base64"
                );


            const profileFolder =
                path.join(
                    __dirname,
                    "profile-pictures"
                );


            if (
                !fs.existsSync(
                    profileFolder
                )
            ) {

                fs.mkdirSync(
                    profileFolder,
                    {
                        recursive: true
                    }
                );

            }


            const filename =
                "member-" +
                memberId +
                "-" +
                Date.now() +
                "." +
                extension;


            const filePath =
                path.join(
                    profileFolder,
                    filename
                );


            fs.writeFileSync(
                filePath,
                buffer
            );


            const picturePath =
                "/profile-pictures/" +
                filename;


            db.run(
                `
                UPDATE members
                SET profile_picture = ?
                WHERE id = ?
                `,

                [
                    picturePath,
                    memberId
                ],

                function (error) {

                    if (error) {

                        console.error(
                            "Profile picture database error:",
                            error
                        );

                        return res.status(500).json({
                            message:
                                "Unable to save profile picture."
                        });

                    }


                    return res.status(200).json({

                        message:
                            "Profile picture updated successfully.",

                        profilePicture:
                            picturePath

                    });

                }
            );

        }

        catch (error) {

            console.error(
                "Profile picture error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to update profile picture."
            });

        }

    }
);


/* =====================================================
   MEMBER - GET NOTIFICATIONS
   ===================================================== */

app.get(
    "/api/member/notifications",
    function (req, res) {

        db.all(
            `
            SELECT
                id,
                title,
                message,
                created_at

            FROM notifications

            ORDER BY
                created_at DESC,
                id DESC
            `,

            [],

            function (
                error,
                notifications
            ) {

                if (error) {

                    console.error(
                        "Notifications error:",
                        error
                    );

                    return res.status(500).json({
                        message:
                            "Unable to load notifications."
                    });

                }


                return res.status(200).json({

                    notifications:
                        notifications || []

                });

            }
        );

    }
);


/* =====================================================
   START SERVER
   ===================================================== */

app.listen(
    PORT,
    function () {

        console.log(
            `French Club server running on http://localhost:${PORT}`
        );

    }
);
