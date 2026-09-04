/* =====================================================
   NUSRAT FRENCH CLUB - MEMBER DASHBOARD
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    console.log("MEMBER DASHBOARD JS LOADED");

    var savedMember =
        localStorage.getItem("frenchClubMember");

    if (!savedMember) {

        alert("Please login first.");

        window.location.href = "login.html";

        return;
    }

    var memberData;

    try {

        memberData =
            JSON.parse(savedMember);

    } catch (error) {

        localStorage.removeItem("frenchClubMember");

        window.location.href = "login.html";

        return;
    }


    /* =================================================
       MEMBER ROLE CHECK
       ================================================= */

    if (
        memberData.role &&
        memberData.role !== "member"
    ) {

        alert(
            "Admin accounts cannot access the member dashboard."
        );

        window.location.href = "login.html";

        return;
    }


    /* =================================================
       MEMBER INFORMATION
       ================================================= */

    setText(
        "memberName",
        memberData.name || "Member"
    );

    setText(
        "myName",
        memberData.name || "-"
    );

    setText(
        "myGR",
        memberData.gr_number || "-"
    );

    setText(
        "myClass",
        memberData.class_name || "-"
    );

    setText(
        "myStatus",
        memberData.status || "Active"
    );

    setText(
        "myPhone",
        memberData.phone || "-"
    );

    setText(
        "myEmail",
        memberData.email || "-"
    );


    if (memberData.date_joined) {

        setText(
            "myDateJoined",
            new Date(
                memberData.date_joined
            ).toLocaleDateString()
        );

    } else {

        setText(
            "myDateJoined",
            "-"
        );
    }


    setText(
        "profileGR",
        memberData.gr_number || "-"
    );

    setText(
        "profileClass",
        memberData.class_name || "-"
    );

    setText(
        "profileStatus",
        memberData.status || "Active"
    );


    /* =================================================
       PROFILE PICTURE
       ================================================= */

    loadProfilePicture(memberData);


    var pictureInput =
        document.getElementById(
            "profilePictureInput"
        );


    if (pictureInput) {

        pictureInput.addEventListener(
            "change",
            function () {

                var file =
                    pictureInput.files[0];

                if (!file) {
                    return;
                }

                uploadProfilePicture(
                    file,
                    memberData
                );

            }
        );

    }


    /* =================================================
       LOAD DASHBOARD DATA
       ================================================= */

    loadMyAttendance(
        memberData.id
    );

    loadMyPayments(
        memberData.id
    );

    console.log(
        "ABOUT TO LOAD NOTIFICATIONS"
    );

    loadNotifications();

    setupChangePassword();


    /* =================================================
       LOGOUT
       ================================================= */

    var logoutButton =
        document.getElementById(
            "memberLogout"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                localStorage.removeItem(
                    "frenchClubMember"
                );

                localStorage.removeItem(
                    "loggedInMember"
                );

                window.location.href =
                    "login.html";

            }
        );

    }

});


/* =====================================================
   SET TEXT
   ===================================================== */

function setText(id, value) {

    var element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}


/* =====================================================
   PROFILE PICTURE
   ===================================================== */

function loadProfilePicture(memberData) {

    var image =
        document.getElementById(
            "profilePicture"
        );


    if (!image) {
        return;
    }


    if (memberData.profile_picture) {

        image.src =
            memberData.profile_picture;

        return;
    }


    image.src =
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(

            '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">' +

            '<circle cx="80" cy="80" r="80" fill="#eeeeee"/>' +

            '<circle cx="80" cy="60" r="25" fill="#999999"/>' +

            '<path d="M35 145 C35 110 55 95 80 95 C105 95 125 110 125 145" fill="#999999"/>' +

            '</svg>'

        );

}


/* =====================================================
   UPLOAD PROFILE PICTURE
   ===================================================== */

function uploadProfilePicture(
    file,
    memberData
) {

    var allowedTypes = [

        "image/jpeg",
        "image/png",
        "image/webp"

    ];


    if (
        allowedTypes.indexOf(
            file.type
        ) === -1
    ) {

        alert(
            "Please choose a JPG, PNG, or WEBP picture."
        );

        return;
    }


    if (
        file.size >
        4 * 1024 * 1024
    ) {

        alert(
            "Picture is too large. Please choose a picture smaller than 4 MB."
        );

        return;
    }


    var reader =
        new FileReader();


    reader.onload =
        async function () {

            var imageData =
                reader.result;


            var image =
                document.getElementById(
                    "profilePicture"
                );


            if (image) {

                image.src =
                    imageData;

            }


            try {

                var response =
                    await fetch(
                        "/api/member/profile-picture",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    memberId:
                                        Number(
                                            memberData.id
                                        ),

                                    image:
                                        imageData

                                })

                        }
                    );


                var data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        "Unable to save profile picture."
                    );

                    loadProfilePicture(
                        memberData
                    );

                    return;
                }


                if (
                    data.profilePicture
                ) {

                    memberData.profile_picture =
                        data.profilePicture;

                    localStorage.setItem(
                        "frenchClubMember",
                        JSON.stringify(
                            memberData
                        )
                    );


                    if (image) {

                        image.src =
                            data.profilePicture;

                    }

                }


                alert(
                    "Profile picture updated successfully."
                );


            } catch (error) {

                console.error(
                    "Profile picture error:",
                    error
                );

                alert(
                    "Unable to connect to server."
                );

                loadProfilePicture(
                    memberData
                );

            }

        };


    reader.readAsDataURL(file);

}


/* =====================================================
   ATTENDANCE
   ===================================================== */

async function loadMyAttendance(
    memberId
) {

    var table =
        document.getElementById(
            "attendanceTable"
        );


    try {

        var response =
            await fetch(
                "/api/member/attendance/" +
                encodeURIComponent(
                    memberId
                )
            );


        var data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Attendance request failed."
            );

        }


        var attendance =
            Array.isArray(
                data.attendance
            )
                ? data.attendance
                : [];


        var presentCount =
            0;

        var absentCount =
            0;


        /* =================================================
           CLEAR TABLE
           ================================================= */

        if (table) {

            table.innerHTML = "";

        }


        /* =================================================
           NO RECORDS
           ================================================= */

        if (
            attendance.length === 0
        ) {

            if (table) {

                var emptyRow =
                    document.createElement(
                        "tr"
                    );


                var emptyCell =
                    document.createElement(
                        "td"
                    );


                emptyCell.colSpan =
                    3;


                emptyCell.textContent =
                    "No attendance records yet.";


                emptyRow.appendChild(
                    emptyCell
                );


                table.appendChild(
                    emptyRow
                );

            }


        } else {


            /* =================================================
               PROCESS ATTENDANCE
               ================================================= */

            attendance.forEach(
                function (record) {

                    var status =
                        String(
                            record.status ||
                            "Absent"
                        ).trim();


                    if (
                        status.toLowerCase() ===
                        "present"
                    ) {

                        presentCount++;

                    } else {

                        absentCount++;

                    }


                    if (!table) {
                        return;
                    }


                    /* ===============================
                       TABLE ROW
                       =============================== */

                    var row =
                        document.createElement(
                            "tr"
                        );


                    /* MEETING */

                    var titleCell =
                        document.createElement(
                            "td"
                        );

                    titleCell.textContent =
                        record.title ||
                        "-";


                    /* DATE */

                    var dateCell =
                        document.createElement(
                            "td"
                        );

                    dateCell.textContent =
                        record.meeting_date ||
                        "-";


                    /* STATUS */

                    var statusCell =
                        document.createElement(
                            "td"
                        );


                    var strong =
                        document.createElement(
                            "strong"
                        );


                    strong.textContent =
                        status;


                    statusCell.appendChild(
                        strong
                    );


                    row.appendChild(
                        titleCell
                    );

                    row.appendChild(
                        dateCell
                    );

                    row.appendChild(
                        statusCell
                    );


                    table.appendChild(
                        row
                    );

                }
            );

        }


        /* =================================================
           CALCULATE ATTENDANCE PERCENTAGE
           ================================================= */

        var totalMeetings =
            attendance.length;


        var attendancePercentage =
            0;


        if (
            totalMeetings > 0
        ) {

            attendancePercentage =
                (
                    presentCount /
                    totalMeetings
                ) * 100;

        }


        /* =================================================
           UPDATE ATTENDANCE CARDS
           ================================================= */

        setText(
            "myMeetingCount",
            totalMeetings
        );


        setText(
            "myPresentCount",
            presentCount
        );


        setText(
            "myAbsentCount",
            absentCount
        );


        setText(
            "myAttendancePercentage",
            attendancePercentage.toFixed(1) + "%"
        );


        /* =================================================
           DEBUG INFORMATION
           ================================================= */

        console.log(
            "Attendance records:",
            totalMeetings
        );

        console.log(
            "Present:",
            presentCount
        );

        console.log(
            "Absent:",
            absentCount
        );

        console.log(
            "Attendance Percentage:",
            attendancePercentage.toFixed(1) + "%"
        );


    } catch (error) {

        console.error(
            "Attendance error:",
            error
        );


        setText(
            "myMeetingCount",
            "0"
        );

        setText(
            "myPresentCount",
            "0"
        );

        setText(
            "myAbsentCount",
            "0"
        );

        setText(
            "myAttendancePercentage",
            "0.0%"
        );


        if (table) {

            table.innerHTML = "";


            var errorRow =
                document.createElement(
                    "tr"
                );


            var errorCell =
                document.createElement(
                    "td"
                );


            errorCell.colSpan =
                3;


            errorCell.textContent =
                "Unable to load attendance.";


            errorRow.appendChild(
                errorCell
            );


            table.appendChild(
                errorRow
            );

        }

    }

}


/* =====================================================
   PAYMENTS
   ===================================================== */

async function loadMyPayments(
    memberId
) {

    var table =
        document.getElementById(
            "paymentsTable"
        );


    try {

        var response =
            await fetch(
                "/api/member/payments/" +
                encodeURIComponent(
                    memberId
                )
            );


        var data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Payments request failed."
            );

        }


        var payments =
            Array.isArray(
                data.payments
            )
                ? data.payments
                : [];


        var totalPaid =
            0;


        if (table) {

            table.innerHTML = "";

        }


        if (
            payments.length === 0
        ) {

            if (table) {

                var emptyRow =
                    document.createElement(
                        "tr"
                    );


                var emptyCell =
                    document.createElement(
                        "td"
                    );


                emptyCell.colSpan =
                    5;


                emptyCell.textContent =
                    "No payment records yet.";


                emptyRow.appendChild(
                    emptyCell
                );


                table.appendChild(
                    emptyRow
                );

            }


        } else {

            payments.forEach(
                function (payment) {

                    var amount =
                        Number(
                            payment.amount
                        ) || 0;


                    if (
                        String(
                            payment.status
                        ).toLowerCase() ===
                        "paid"
                    ) {

                        totalPaid +=
                            amount;

                    }


                    if (!table) {
                        return;
                    }


                    var row =
                        document.createElement(
                            "tr"
                        );


                    var dateCell =
                        document.createElement(
                            "td"
                        );

                    dateCell.textContent =
                        payment.payment_date ||
                        "-";


                    var amountCell =
                        document.createElement(
                            "td"
                        );

                    amountCell.textContent =
                        "GMD " +
                        amount.toFixed(2);


                    var methodCell =
                        document.createElement(
                            "td"
                        );

                    methodCell.textContent =
                        payment.payment_method ||
                        "-";


                    var statusCell =
                        document.createElement(
                            "td"
                        );

                    statusCell.textContent =
                        payment.status ||
                        "-";


                    var notesCell =
                        document.createElement(
                            "td"
                        );

                    notesCell.textContent =
                        payment.notes ||
                        "-";


                    row.appendChild(
                        dateCell
                    );

                    row.appendChild(
                        amountCell
                    );

                    row.appendChild(
                        methodCell
                    );

                    row.appendChild(
                        statusCell
                    );

                    row.appendChild(
                        notesCell
                    );


                    table.appendChild(
                        row
                    );

                }
            );

        }


        setText(
            "myTotalPaid",
            "GMD " +
            totalPaid.toFixed(2)
        );


        setText(
            "myPaymentCount",
            payments.length
        );


    } catch (error) {

        console.error(
            "Payment error:",
            error
        );


        if (table) {

            table.innerHTML = "";


            var errorRow =
                document.createElement(
                    "tr"
                );


            var errorCell =
                document.createElement(
                    "td"
                );


            errorCell.colSpan =
                5;


            errorCell.textContent =
                "Unable to load payments.";


            errorRow.appendChild(
                errorCell
            );


            table.appendChild(
                errorRow
            );

        }

    }

}


/* =====================================================
   CHANGE PASSWORD
   ===================================================== */

function setupChangePassword() {

    var forms =
        document.querySelectorAll(
            "#changePasswordForm"
        );


    if (!forms.length) {
        return;
    }


    var form =
        forms[forms.length - 1];


    var button =
        form.querySelector(
            "#savePasswordButton"
        );


    var message =
        form.querySelector(
            "#passwordMessage"
        );


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            var savedMember =
                localStorage.getItem(
                    "frenchClubMember"
                );


            if (!savedMember) {

                window.location.href =
                    "login.html";

                return;
            }


            var memberData =
                JSON.parse(
                    savedMember
                );


            var currentPassword =
                form.querySelector(
                    "#currentPassword"
                ).value;


            var newPassword =
                form.querySelector(
                    "#newPassword"
                ).value;


            var confirmPassword =
                form.querySelector(
                    "#confirmPassword"
                ).value;


            if (
                newPassword !==
                confirmPassword
            ) {

                message.textContent =
                    "New passwords do not match.";

                message.style.color =
                    "red";

                return;
            }


            if (
                newPassword.length < 6
            ) {

                message.textContent =
                    "New password must be at least 6 characters.";

                message.style.color =
                    "red";

                return;
            }


            if (
                currentPassword ===
                newPassword
            ) {

                message.textContent =
                    "New password must be different from your current password.";

                message.style.color =
                    "red";

                return;
            }


            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "Changing password...";

            }


            try {

                var response =
                    await fetch(
                        "/api/member/change-password",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    memberId:
                                        Number(
                                            memberData.id
                                        ),

                                    currentPassword:
                                        currentPassword,

                                    newPassword:
                                        newPassword

                                })

                        }
                    );


                var data =
                    await response.json();


                if (!response.ok) {

                    message.textContent =
                        data.message ||
                        "Current password is incorrect.";

                    message.style.color =
                        "red";


                    if (button) {

                        button.disabled =
                            false;

                        button.textContent =
                            "🔐 Change Password";

                    }

                    return;
                }


                message.textContent =
                    "Password changed successfully!";

                message.style.color =
                    "green";


                form.reset();


                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "🔐 Change Password";

                }


            } catch (error) {

                console.error(
                    "Change password error:",
                    error
                );


                message.textContent =
                    "Unable to connect to server.";

                message.style.color =
                    "red";


                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "🔐 Change Password";

                }

            }

        }
    );

}


/* =====================================================
   LOAD MEMBER NOTIFICATIONS
   ===================================================== */

async function loadNotifications() {

    var container =
        document.getElementById(
            "notificationsContainer"
        );


    if (!container) {
        return;
    }


    try {

        var response =
            await fetch(
                "/api/member/notifications"
            );


        var data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load notifications."
            );

        }


        var notifications =
            Array.isArray(
                data.notifications
            )
                ? data.notifications
                : [];


        container.innerHTML =
            "";


        if (
            notifications.length === 0
        ) {

            var emptyMessage =
                document.createElement(
                    "p"
                );


            emptyMessage.textContent =
                "No notifications yet.";


            container.appendChild(
                emptyMessage
            );


            return;
        }


        notifications.forEach(
            function (notification) {

                var card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "notification-card";


                var title =
                    document.createElement(
                        "h3"
                    );


                title.textContent =
                    "🔔 " +
                    notification.title;


                var message =
                    document.createElement(
                        "p"
                    );


                message.textContent =
                    notification.message;


                var date =
                    document.createElement(
                        "small"
                    );


                date.textContent =
                    notification.created_at;


                card.appendChild(
                    title
                );

                card.appendChild(
                    message
                );

                card.appendChild(
                    date
                );


                container.appendChild(
                    card
                );

            }
        );


    } catch (error) {

        console.error(
            "Notifications error:",
            error
        );


        container.innerHTML =
            "";


        var errorMessage =
            document.createElement(
                "p"
            );


        errorMessage.textContent =
            "Unable to load notifications.";


        container.appendChild(
            errorMessage
        );

    }

}


/* =====================================================
   END OF MEMBER DASHBOARD
   ===================================================== */