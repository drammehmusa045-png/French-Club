require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const db = require("../database/database");

const app = express();

const PORT = process.env.PORT || 3000;


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


/* =====================================================
   PROFILE PICTURES
   ===================================================== */

const profilePicturesPath = path.join(
    __dirname,
    "profile-pictures"
);

if (!fs.existsSync(profilePicturesPath)) {

    fs.mkdirSync(
        profilePicturesPath,
        {
            recursive: true
        }
    );

}

app.use(
    "/profile-pictures",
    express.static(profilePicturesPath)
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

        return res.status(200).json({

            message:
                "French Club Management System API is running."

        });

    }
);


/* =====================================================
   ADMIN SECURITY
   ===================================================== */

function requireAdmin(req, res, next) {

    const grNumber =
        String(
            req.headers["x-admin-gr"] || ""
        )
            .trim()
            .toUpperCase();


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

        function (
            error,
            member
        ) {

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


            if (!member) {

                return res.status(403).json({

                    message:
                        "Administrator privileges are required."

                });

            }


            if (member.role !== "admin") {

                return res.status(403).json({

                    message:
                        "Administrator privileges are required."

                });

            }


            if (
                member.status &&
                member.status !== "Active"
            ) {

                return res.status(403).json({

                    message:
                        "This administrator account is inactive."

                });

            }


            next();

        }
    );

}


/* =====================================================
   MEMBER REGISTRATION
   ===================================================== */

app.post(
    "/api/auth/register",
    async function (req, res) {

        try {

            const name =
                String(
                    req.body.name || ""
                ).trim();

            const grNumber =
                String(
                    req.body.grNumber || ""
                )
                    .trim()
                    .toUpperCase();

            const className =
                String(
                    req.body.className || ""
                ).trim();

            const phone =
                String(
                    req.body.phone || ""
                ).trim();

            const email =
                String(
                    req.body.email || ""
                ).trim();

            const password =
                String(
                    req.body.password || ""
                );


            if (
                !name ||
                !grNumber ||
                !className ||
                !phone ||
                !password
            ) {

                return res.status(400).json({

                    message:
                        "Please complete all required fields."

                });

            }


            if (password.length < 6) {

                return res.status(400).json({

                    message:
                        "Password must be at least 6 characters."

                });

            }


            db.get(
                `
                SELECT id
                FROM members
                WHERE gr_number = ?
                `,

                [grNumber],

                async function (
                    error,
                    existingMember
                ) {

                    if (error) {

                        console.error(
                            "Registration database error:",
                            error
                        );

                        return res.status(500).json({

                            message:
                                "Database error."

                        });

                    }


                    if (existingMember) {

                        return res.status(409).json({

                            message:
                                "This GR number is already registered."

                        });

                    }


                    try {

                        const hashedPassword =
                            await bcrypt.hash(
                                password,
                                10
                            );


                        const dateJoined =
                            new Date().toISOString();


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
                                name,
                                grNumber,
                                className,
                                phone,
                                email || null,
                                hashedPassword,
                                dateJoined,
                                "Active",
                                "member"
                            ],

                            function (
                                insertError
                            ) {

                                if (insertError) {

                                    console.error(
                                        "Member registration error:",
                                        insertError
                                    );

                                    return res.status(500).json({

                                        message:
                                            "Unable to register member."

                                    });

                                }


                                console.log(
                                    "New member registered:",
                                    grNumber
                                );


                                return res.status(201).json({

                                    message:
                                        "Member registered successfully.",

                                    memberId:
                                        this.lastID,

                                    role:
                                        "member"

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
                                "Unable to create account."

                        });

                    }

                }
            );

        }

        catch (error) {

            console.error(
                "Registration server error:",
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
   MEMBER / ADMIN LOGIN
   ===================================================== */

app.post(
    "/api/auth/login",
    async function (req, res) {

        try {

            const grNumber =
                String(
                    req.body.grNumber || ""
                )
                    .trim()
                    .toUpperCase();

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


                        if (
                            member.status &&
                            member.status !== "Active"
                        ) {

                            return res.status(403).json({

                                message:
                                    "This account is inactive."

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
   WITH ATTENDANCE PERCENTAGE
   ===================================================== */

app.get(
    "/api/admin/members",
    requireAdmin,
    function (req, res) {

        db.all(
            `
            SELECT
                members.id,
                members.name,
                members.gr_number,
                members.class_name,
                members.phone,
                members.email,
                members.date_joined,
                members.status,
                members.role,
                members.profile_picture,

                COUNT(DISTINCT meetings.id)
                    AS total_meetings,

                SUM(
                    CASE
                        WHEN attendance.status = 'Present'
                        THEN 1
                        ELSE 0
                    END
                ) AS present_count,

                SUM(
                    CASE
                        WHEN attendance.status = 'Absent'
                        THEN 1
                        ELSE 0
                    END
                ) AS recorded_absent_count

            FROM members

            LEFT JOIN meetings
                ON 1 = 1

            LEFT JOIN attendance
                ON attendance.member_id = members.id
                AND attendance.meeting_id = meetings.id

            GROUP BY
                members.id,
                members.name,
                members.gr_number,
                members.class_name,
                members.phone,
                members.email,
                members.date_joined,
                members.status,
                members.role,
                members.profile_picture

            ORDER BY members.id DESC
            `,

            [],

            function (
                error,
                members
            ) {

                if (error) {

                    console.error(
                        "Error loading members with attendance:",
                        error
                    );

                    return res.status(500).json({

                        message:
                            "Unable to load members."

                    });

                }


                const processedMembers =
                    (members || []).map(
                        function (member) {

                            const totalMeetings =
                                Number(
                                    member.total_meetings || 0
                                );

                            const presentCount =
                                Number(
                                    member.present_count || 0
                                );

                            const absentCount =
                                Number(
                                    member.recorded_absent_count || 0
                                );


                            let attendancePercentage = 0;


                            if (
                                totalMeetings > 0
                            ) {

                                attendancePercentage =
                                    (
                                        presentCount /
                                        totalMeetings
                                    ) * 100;

                            }


                            return {

                                id:
                                    member.id,

                                name:
                                    member.name,

                                gr_number:
                                    member.gr_number,

                                class_name:
                                    member.class_name,

                                phone:
                                    member.phone,

                                email:
                                    member.email,

                                date_joined:
                                    member.date_joined,

                                status:
                                    member.status || "Active",

                                role:
                                    member.role,

                                profile_picture:
                                    member.profile_picture || null,

                                total_meetings:
                                    totalMeetings,

                                present_count:
                                    presentCount,

                                absent_count:
                                    absentCount,

                                attendance_percentage:
                                    Number(
                                        attendancePercentage.toFixed(1)
                                    )

                            };

                        }
                    );


                return res.status(200).json({

                    members:
                        processedMembers

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
            Number(
                req.params.id
            );

        const name =
            String(
                req.body.name || ""
            ).trim();

        const grNumber =
            String(
                req.body.grNumber || ""
            )
                .trim()
                .toUpperCase();

        const className =
            String(
                req.body.className || ""
            ).trim();

        const phone =
            String(
                req.body.phone || ""
            ).trim();

        const email =
            String(
                req.body.email || ""
            ).trim();

        const status =
            String(
                req.body.status || "Active"
            ).trim();

        const role =
            String(
                req.body.role || "member"
            )
                .trim()
                .toLowerCase();


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


        if (
            role !== "admin" &&
            role !== "member"
        ) {

            return res.status(400).json({

                message:
                    "Invalid member role."

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
                findError,
                member
            ) {

                if (findError) {

                    console.error(
                        "Find member error:",
                        findError
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


                db.get(
                    `
                    SELECT id
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
                                "Duplicate GR check error:",
                                duplicateError
                            );

                            return res.status(500).json({

                                message:
                                    "Unable to check GR number."

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
                                status = ?,
                                role = ?
                            WHERE id = ?
                            `,

                            [
                                name,
                                grNumber,
                                className,
                                phone,
                                email || null,
                                status,
                                role,
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
                                    WHERE id = ?
                                    `,

                                    [memberId],

                                    function (
                                        selectError,
                                        updatedMember
                                    ) {

                                        if (selectError) {

                                            console.error(
                                                "Reload updated member error:",
                                                selectError
                                            );

                                            return res.status(500).json({

                                                message:
                                                    "Member updated but could not be reloaded."

                                            });

                                        }


                                        return res.status(200).json({

                                            message:
                                                "Member information updated successfully.",

                                            member:
                                                updatedMember

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
   ADMIN - UPDATE MEMBER PHONE
   ===================================================== */

app.put(
    "/api/admin/members/:grNumber/phone",
    requireAdmin,
    function (req, res) {

        const grNumber =
            String(
                req.params.grNumber || ""
            )
                .trim()
                .toUpperCase();

        const phone =
            String(
                req.body.phone || ""
            ).trim();


        if (!grNumber) {

            return res.status(400).json({

                message:
                    "GR number is required."

            });

        }


        if (!phone) {

            return res.status(400).json({

                message:
                    "Phone number is required."

            });

        }


        db.run(
            `
            UPDATE members
            SET phone = ?
            WHERE gr_number = ?
            `,

            [
                phone,
                grNumber
            ],

            function (error) {

                if (error) {

                    console.error(
                        "Update phone error:",
                        error
                    );

                    return res.status(500).json({

                        message:
                            "Unable to update phone number."

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


                return res.status(200).json({

                    message:
                        "Phone number updated successfully.",

                    grNumber:
                        grNumber,

                    phone:
                        phone

                });

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
                Number(
                    req.params.id
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
                        "Invalid member ID."

                });

            }


            if (!newPassword) {

                return res.status(400).json({

                    message:
                        "Please enter a new password."

                });

            }


            if (
                newPassword.length < 6
            ) {

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
                    role
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
            Number(
                req.params.id
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

                    function (
                        attendanceError
                    ) {

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
   ADMIN - PROMOTE MEMBERS TO ADMIN
   ===================================================== */

app.post(
    "/api/admin/promote-members",
    requireAdmin,
    function (req, res) {

        const grNumbers =
            Array.isArray(
                req.body.grNumbers
            )
                ? req.body.grNumbers
                : [];


        if (
            grNumbers.length === 0
        ) {

            return res.status(400).json({

                message:
                    "No members selected."

            });

        }


        const cleanGRNumbers =
            grNumbers
                .map(
                    function (gr) {

                        return String(
                            gr
                        )
                            .trim()
                            .toUpperCase();

                    }
                )
                .filter(Boolean);


        if (
            cleanGRNumbers.length === 0
        ) {

            return res.status(400).json({

                message:
                    "No valid GR numbers were provided."

            });

        }


        let completed = 0;
        let updated = 0;
        let failed = false;


        cleanGRNumbers.forEach(
            function (grNumber) {

                db.run(
                    `
                    UPDATE members
                    SET role = 'admin'
                    WHERE
                        gr_number = ?
                        AND role = 'member'
                    `,

                    [grNumber],

                    function (error) {

                        if (failed) {
                            return;
                        }


                        if (error) {

                            failed = true;

                            console.error(
                                "Promote members error:",
                                error
                            );

                            return res.status(500).json({

                                message:
                                    "Unable to promote members."

                            });

                        }


                        updated += this.changes;

                        completed++;


                        if (
                            completed ===
                            cleanGRNumbers.length
                        ) {

                            return res.status(200).json({

                                message:
                                    "Members promoted successfully.",

                                updated:
                                    updated

                            });

                        }

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
            ORDER BY
                meeting_date DESC,
                id DESC
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
                            "Unable to find meeting."

                    });

                }


                if (!meeting) {

                    return res.status(404).json({

                        message:
                            "Meeting not found."

                    });

                }


                db.run(
                    `
                    DELETE FROM attendance
                    WHERE meeting_id = ?
                    `,

                    [meetingId],

                    function (
                        attendanceError
                    ) {

                        if (attendanceError) {

                            console.error(
                                "Error deleting meeting attendance:",
                                attendanceError
                            );

                            return res.status(500).json({

                                message:
                                    "Unable to delete meeting attendance."

                            });

                        }


                        db.run(
                            `
                            DELETE FROM meetings
                            WHERE id = ?
                            `,

                            [meetingId],

                            function (
                                deleteError
                            ) {

                                if (deleteError) {

                                    console.error(
                                        "Error deleting meeting:",
                                        deleteError
                                    );

                                    return res.status(500).json({

                                        message:
                                            "Unable to delete meeting."

                                    });

                                }


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


        db.get(
            `
            SELECT id
            FROM meetings
            WHERE id = ?
            `,

            [meetingId],

            function (
                meetingError,
                meeting
            ) {

                if (meetingError) {

                    console.error(
                        "Meeting verification error:",
                        meetingError
                    );

                    return res.status(500).json({

                        message:
                            "Unable to verify meeting."

                    });

                }


                if (!meeting) {

                    return res.status(404).json({

                        message:
                            "Meeting not found."

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

                    WHERE members.role = 'member'

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
                                    "Unable to load attendance."

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
            String(
                req.body.status || ""
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

            ON CONFLICT(
                meeting_id,
                member_id
            )

            DO UPDATE SET

                status =
                    excluded.status,

                marked_at =
                    excluded.marked_at
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
                            ? Number(
                                result.total || 0
                            )
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
   ADMIN - PROMOTE MEMBERS TO ADMIN
   ===================================================== */

app.post(
    "/api/admin/promote-members",
    requireAdmin,
    function (req, res) {

        const grNumbers = Array.isArray(req.body.grNumbers)
            ? req.body.grNumbers
            : [];

        if (grNumbers.length === 0) {
            return res.status(400).json({
                message: "No members selected."
            });
        }

        const cleanGRNumbers = grNumbers
            .map(function (gr) {
                return String(gr).trim().toUpperCase();
            })
            .filter(Boolean);

        const placeholders = cleanGRNumbers
            .map(function () {
                return "?";
            })
            .join(",");

        db.run(
            `
            UPDATE members
            SET role = 'admin'
            WHERE gr_number IN (${placeholders})
            `,
            cleanGRNumbers,
            function (error) {

                if (error) {
                    console.error(
                        "Promote members error:",
                        error
                    );

                    return res.status(500).json({
                        message: "Unable to promote members."
                    });
                }

                return res.status(200).json({
                    message: "Members promoted successfully.",
                    updated: this.changes
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

        const memberId =
            Number(
                req.body.memberId
            );

        const amount =
            Number(
                req.body.amount
            );

        const paymentDate =
            String(
                req.body.paymentDate || ""
            ).trim();

        const paymentMethod =
            String(
                req.body.paymentMethod || "Cash"
            ).trim();

        const status =
            String(
                req.body.status || "Paid"
            ).trim();

        const notes =
            req.body.notes
                ? String(
                    req.body.notes
                ).trim()
                : null;


        if (
            !Number.isInteger(memberId) ||
            memberId <= 0
        ) {

            return res.status(400).json({

                message:
                    "Member is required."

            });

        }


        if (
            !Number.isFinite(amount) ||
            amount <= 0
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


        if (
            status !== "Paid" &&
            status !== "Pending" &&
            status !== "Cancelled"
        ) {

            return res.status(400).json({

                message:
                    "Invalid payment status."

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
                amount,
                paymentDate,
                paymentMethod || "Cash",
                status,
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
                subscriptions.payment_date DESC,
                subscriptions.id DESC
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
                            ? Number(
                                result.total || 0
                            )
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
            )
                .trim()
                .toUpperCase();


        if (!grNumber) {

            return res.status(400).json({

                message:
                    "GR number is required."

            });

        }


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
   MEMBER - UPDATE OWN PROFILE
   ===================================================== */

app.put(
    "/api/member/profile/:grNumber",
    function (req, res) {

        const grNumber =
            String(
                req.params.grNumber || ""
            )
                .trim()
                .toUpperCase();

        const phone =
            String(
                req.body.phone || ""
            ).trim();

        const email =
            String(
                req.body.email || ""
            ).trim();


        if (!grNumber) {

            return res.status(400).json({

                message:
                    "GR number is required."

            });

        }


        db.get(
            `
            SELECT
                id,
                name,
                gr_number
            FROM members
            WHERE gr_number = ?
            `,

            [grNumber],

            function (
                findError,
                member
            ) {

                if (findError) {

                    console.error(
                        "Profile member lookup error:",
                        findError
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


                db.run(
                    `
                    UPDATE members
                    SET
                        phone = ?,
                        email = ?
                    WHERE gr_number = ?
                    `,

                    [
                        phone,
                        email || null,
                        grNumber
                    ],

                    function (updateError) {

                        if (updateError) {

                            console.error(
                                "Profile update database error:",
                                updateError
                            );

                            return res.status(500).json({

                                message:
                                    "Unable to update profile."

                            });

                        }


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
                                selectError,
                                updatedMember
                            ) {

                                if (selectError) {

                                    console.error(
                                        "Profile reload error:",
                                        selectError
                                    );

                                    return res.status(500).json({

                                        message:
                                            "Profile was updated, but could not be reloaded."

                                    });

                                }


                                return res.status(200).json({

                                    message:
                                        "Profile updated successfully.",

                                    member:
                                        updatedMember

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
   MEMBER - OWN ATTENDANCE
   ===================================================== */

app.get(
    "/api/member/attendance/:memberId",
    function (req, res) {

        const memberId =
            Number(
                req.params.memberId
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

            ORDER BY
                meetings.meeting_date DESC
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


        if (
            !Number.isInteger(memberId) ||
            memberId <= 0
        ) {

            return res.status(400).json({

                message:
                    "Invalid member."

            });

        }


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

            ORDER BY
                payment_date DESC
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


            if (
                newPassword.length < 6
            ) {

                return res.status(400).json({

                    message:
                        "New password must be at least 6 characters."

                });

            }


            if (
                currentPassword === newPassword
            ) {

                return res.status(400).json({

                    message:
                        "New password must be different from your current password."

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


            const filename =
                "member-" +
                memberId +
                "-" +
                Date.now() +
                "." +
                extension;


            const filePath =
                path.join(
                    profilePicturesPath,
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


                    if (
                        this.changes === 0
                    ) {

                        return res.status(404).json({

                            message:
                                "Member not found."

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
   SITEMAP
   ===================================================== */

app.get(
    "/sitemap.xml",
    function (req, res) {

        res.sendFile(
            path.join(
                __dirname,
                "sitemap.xml"
            )
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
            `French Club server running on port ${PORT}`
        );

        console.log(
            `Frontend available at http://localhost:${PORT}`
        );

    }
);
