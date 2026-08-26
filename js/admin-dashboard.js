/* =====================================================
   FRENCH CLUB MANAGEMENT SYSTEM
   EXECUTIVE DASHBOARD
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    console.log("French Club Executive Dashboard loaded.");

    loadMembers();
    loadMeetings();
    loadAttendanceCount();
    loadPayments();

    const createButton =
        document.getElementById("createMeetingButton");

    if (createButton) {
        createButton.addEventListener(
            "click",
            openMeetingForm
        );
    }


    const paymentButton =
        document.getElementById("addPaymentButton");

    if (paymentButton) {

        paymentButton.addEventListener(
            "click",
            function () {

                console.log("Record Payment clicked.");

                openPaymentForm();

            }
        );

    } else {

        console.error(
            "Record Payment button not found."
        );

    }


    const cancelButton =
        document.getElementById("cancelMeetingButton");

    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            closeMeetingForm
        );
    }


    const meetingForm =
        document.getElementById("meetingForm");

    if (meetingForm) {
        meetingForm.addEventListener(
            "submit",
            createMeeting
        );
    }


    const logout =
        document.getElementById("adminLogout");

    if (logout) {

        logout.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                window.location.href =
                    "index.html";

            }
        );

    }

});


    /* =====================================================
       CANCEL MEETING BUTTON
       ===================================================== */

    const cancelButton =
        document.getElementById("cancelMeetingButton");

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeMeetingForm
        );

    }


    /* =====================================================
       MEETING FORM
       ===================================================== */

    const meetingForm =
        document.getElementById("meetingForm");

    if (meetingForm) {

        meetingForm.addEventListener(
            "submit",
            createMeeting
        );

    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    const logout =
        document.getElementById("adminLogout");

    if (logout) {

        logout.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                window.location.href =
                    "index.html";

            }
        );

    }

});


/* =====================================================
   LOAD MEMBERS
   ===================================================== */

async function loadMembers() {

    console.log("Loading members...");

    const table =
        document.getElementById("membersTable");

    if (!table) {

        console.error(
            "membersTable element not found."
        );

        return;
    }

    try {

        const response =
            await fetch(
                "/api/admin/members"
            );

        const data =
            await response.json();

        console.log(
            "Members:",
            data
        );

        if (!response.ok) {

            table.innerHTML =
                "<tr><td colspan='7'>Unable to load members.</td></tr>";

            return;
        }

        const members =
            data.members || [];


        /* TOTAL MEMBERS */

        const total =
            document.getElementById(
                "totalMembers"
            );

        if (total) {

            total.textContent =
                members.length;

        }


        /* ACTIVE MEMBERS */

        const active =
            document.getElementById(
                "activeMembers"
            );

        if (active) {

            active.textContent =
                members.filter(
                    function (member) {

                        return (
                            member.status === "Active" ||
                            member.status === "active"
                        );

                    }
                ).length;

        }


        /* CLEAR TABLE */

        table.innerHTML = "";


        /* NO MEMBERS */

        if (members.length === 0) {

            table.innerHTML =
                "<tr><td colspan='7'>No members registered yet.</td></tr>";

            return;
        }


        /* DISPLAY MEMBERS */

        members.forEach(
            function (member, index) {

                const row =
                    document.createElement("tr");

                let dateJoined =
                    "N/A";

                if (member.date_joined) {

                    const date =
                        new Date(
                            member.date_joined
                        );

                    if (!isNaN(date.getTime())) {

                        dateJoined =
                            date.toLocaleDateString();

                    }

                }

                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${member.name || ""}
                    </td>

                    <td>
                        ${member.gr_number || ""}
                    </td>

                    <td>
                        ${member.class_name || ""}
                    </td>

                    <td>
                        ${member.phone || ""}
                    </td>

                    <td>
                        ${member.status || ""}
                    </td>

                    <td>
                        ${dateJoined}
                    </td>

                `;

                table.appendChild(row);

            }
        );

    }

    catch (error) {

        console.error(
            "Members error:",
            error
        );

        table.innerHTML =
            "<tr><td colspan='7'>Unable to connect to server.</td></tr>";

    }

}


/* =====================================================
   LOAD MEETINGS
   ===================================================== */

async function loadMeetings() {

    console.log("Loading meetings...");

    const list =
        document.getElementById(
            "meetingsList"
        );

    if (!list) {

        console.error(
            "meetingsList element not found."
        );

        return;
    }

    list.innerHTML =
        "<p>Loading meetings...</p>";

    try {

        const response =
            await fetch(
                "/api/admin/meetings"
            );

        const data =
            await response.json();

        console.log(
            "Meetings:",
            data
        );

        if (!response.ok) {

            list.innerHTML =
                "<p>Unable to load meetings.</p>";

            return;
        }

        const meetings =
            data.meetings || [];


        /* TOTAL MEETINGS */

        const total =
            document.getElementById(
                "totalMeetings"
            );

        if (total) {

            total.textContent =
                meetings.length;

        }


        /* CLEAR */

        list.innerHTML = "";


        /* NO MEETINGS */

        if (meetings.length === 0) {

            list.innerHTML =
                "<p>No meetings created yet.</p>";

            return;
        }


        /* DISPLAY MEETINGS */

        meetings.forEach(
            function (meeting) {

                const card =
                    document.createElement("div");

                card.className =
                    "meeting-card";

                card.style.padding =
                    "20px";

                card.style.marginBottom =
                    "15px";

                card.style.border =
                    "1px solid #ddd";

                card.style.borderRadius =
                    "10px";

                card.style.background =
                    "#ffffff";


                /* DATE */

                let displayDate =
                    meeting.meeting_date ||
                    "No date";

                if (meeting.meeting_date) {

                    const date =
                        new Date(
                            meeting.meeting_date +
                            "T00:00:00"
                        );

                    if (!isNaN(date.getTime())) {

                        displayDate =
                            date.toLocaleDateString();

                    }

                }


                /* MEETING CARD */

                card.innerHTML = `

                    <h3>
                        📅
                        ${meeting.title || "Untitled Meeting"}
                    </h3>

                    <p>
                        <strong>
                            Meeting Number:
                        </strong>

                        ${meeting.id}
                    </p>

                    <p>
                        <strong>
                            Date:
                        </strong>

                        ${displayDate}
                    </p>

                    <p>
                        <strong>
                            Description:
                        </strong>

                        ${
                            meeting.description ||
                            "No description provided."
                        }
                    </p>

                    <button
                        type="button"
                        class="submit-btn attendance-button"
                    >
                        👥 Take Attendance
                    </button>

                    <div
                        class="attendance-area"
                        style="
                            display:none;
                            margin-top:20px;
                        "
                    ></div>

                `;


                list.appendChild(card);


                /* ATTENDANCE BUTTON */

                const button =
                    card.querySelector(
                        ".attendance-button"
                    );

                const area =
                    card.querySelector(
                        ".attendance-area"
                    );


                button.addEventListener(
                    "click",
                    function () {

                        if (
                            area.style.display ===
                            "block"
                        ) {

                            area.style.display =
                                "none";

                            button.textContent =
                                "👥 Take Attendance";

                            return;
                        }


                        area.style.display =
                            "block";

                        button.textContent =
                            "👥 Hide Attendance";


                        loadAttendance(
                            meeting.id,
                            area
                        );

                    }
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Meetings error:",
            error
        );

        list.innerHTML =
            "<p>Unable to connect to server.</p>";

    }

}


/* =====================================================
   LOAD ATTENDANCE
   ===================================================== */

async function loadAttendance(
    meetingId,
    container
) {

    console.log(
        "Loading attendance for meeting:",
        meetingId
    );

    try {

        const response =
            await fetch(
                "/api/admin/meetings/" +
                meetingId +
                "/attendance"
            );

        const data =
            await response.json();

        console.log(
            "Attendance:",
            data
        );


        if (!response.ok) {

            container.innerHTML =
                "<p>Unable to load attendance.</p>";

            return;
        }


        const members =
            data.members || [];


        if (members.length === 0) {

            container.innerHTML =
                "<p>No members registered.</p>";

            return;
        }


        container.innerHTML = `
            <h3>
                👥 Member Attendance
            </h3>
        `;


        members.forEach(
            function (member) {

                const row =
                    document.createElement("div");

                row.style.padding =
                    "10px";

                row.style.borderBottom =
                    "1px solid #ddd";


                const currentStatus =
                    member.attendance_status ||
                    "Absent";


                row.innerHTML = `

                    <strong>
                        ${member.name || ""}
                    </strong>

                    <span>
                        (${member.gr_number || ""})
                    </span>

                    <select
                        class="attendance-status"
                    >

                        <option value="Present">
                            Present
                        </option>

                        <option value="Absent">
                            Absent
                        </option>

                    </select>

                    <button
                        type="button"
                        class="save-attendance"
                    >
                        Save
                    </button>

                `;


                container.appendChild(row);


                const select =
                    row.querySelector(
                        ".attendance-status"
                    );

                const saveButton =
                    row.querySelector(
                        ".save-attendance"
                    );


                /* CURRENT STATUS */

                select.value =
                    currentStatus;


                /* SAVE ATTENDANCE */

                saveButton.addEventListener(
                    "click",
                    async function () {

                        const selectedStatus =
                            select.value;


                        console.log(
                            "Saving attendance:",
                            {
                                meetingId:
                                    meetingId,

                                memberId:
                                    member.id,

                                status:
                                    selectedStatus
                            }
                        );


                        saveButton.disabled =
                            true;

                        saveButton.textContent =
                            "Saving...";


                        try {

                            const saveResponse =
                                await fetch(
                                    "/api/admin/meetings/" +
                                    meetingId +
                                    "/attendance",
                                    {
                                        method:
                                            "POST",

                                        headers: {
                                            "Content-Type":
                                                "application/json"
                                        },

                                        body:
                                            JSON.stringify({

                                                memberId:
                                                    member.id,

                                                status:
                                                    selectedStatus

                                            })
                                    }
                                );


                            const saveData =
                                await saveResponse.json();


                            console.log(
                                "Save response:",
                                saveData
                            );


                            if (!saveResponse.ok) {

                                alert(
                                    saveData.message ||
                                    "Unable to save attendance."
                                );

                                saveButton.disabled =
                                    false;

                                saveButton.textContent =
                                    "Save";

                                return;
                            }


                            saveButton.textContent =
                                "✓ Saved";


                            /*
                             * IMPORTANT:
                             * UPDATE THE OVERVIEW
                             * IMMEDIATELY AFTER SAVING.
                             */

                            await loadAttendanceCount();


                            /*
                             * If the member was changed
                             * to Present/Absent, reload
                             * the attendance list so the
                             * saved status is reflected.
                             */

                            await loadAttendance(
                                meetingId,
                                container
                            );

                        }

                        catch (error) {

                            console.error(
                                "Attendance save error:",
                                error
                            );

                            saveButton.disabled =
                                false;

                            saveButton.textContent =
                                "Save";

                        }

                    }
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Attendance error:",
            error
        );

        container.innerHTML =
            "<p>Unable to connect to server.</p>";

    }

}


/* =====================================================
   LOAD ATTENDANCE COUNT
   ===================================================== */

async function loadAttendanceCount() {

    console.log(
        "Updating attendance overview..."
    );


    const element =
        document.getElementById(
            "attendanceCount"
        );


    if (!element) {

        console.error(
            "attendanceCount element not found."
        );

        return;
    }


    try {

        const response =
            await fetch(
                "/api/admin/attendance/count?time=" +
                Date.now()
            );


        const data =
            await response.json();


        console.log(
            "Latest attendance count:",
            data.total
        );


        if (!response.ok) {

            console.error(
                "Attendance count request failed."
            );

            return;
        }


        /*
         * Your backend returns:
         *
         * { total: 1 }
         */

                element.textContent =
    data.count || 0;
    }

    catch (error) {

        console.error(
            "Attendance count error:",
            error
        );

    }

}


/* =====================================================
   OPEN MEETING FORM
   ===================================================== */

function openMeetingForm() {

    const container =
        document.getElementById(
            "meetingFormContainer"
        );


    if (!container) {

        console.error(
            "meetingFormContainer not found."
        );

        return;
    }


    container.style.display =
        "block";


    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =====================================================
   CLOSE MEETING FORM
   ===================================================== */

function closeMeetingForm() {

    const container =
        document.getElementById(
            "meetingFormContainer"
        );


    if (!container) {

        return;
    }


    container.style.display =
        "none";

}


/* =====================================================
   CREATE MEETING
   ===================================================== */

async function createMeeting(event) {

    event.preventDefault();


    const title =
        document.getElementById(
            "meetingTitle"
        ).value.trim();


    const meetingDate =
        document.getElementById(
            "meetingDate"
        ).value;


    const description =
        document.getElementById(
            "meetingDescription"
        ).value.trim();


    const message =
        document.getElementById(
            "meetingMessage"
        );


    if (!title) {

        message.textContent =
            "Please enter a meeting title.";

        return;
    }


    if (!meetingDate) {

        message.textContent =
            "Please select a meeting date.";

        return;
    }


    message.textContent =
        "Creating meeting...";


    try {

        const response =
            await fetch(
                "/api/admin/meetings",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            title:
                                title,

                            meetingDate:
                                meetingDate,

                            description:
                                description

                        })
                }
            );


        const data =
            await response.json();


        console.log(
            "Create meeting:",
            data
        );


        if (!response.ok) {

            message.textContent =
                data.message ||
                "Unable to create meeting.";

            return;
        }


        message.textContent =
            "✅ Meeting created successfully.";


        document
            .getElementById(
                "meetingForm"
            )
            .reset();


        await loadMeetings();


        setTimeout(
            function () {

                closeMeetingForm();

                message.textContent =
                    "";

            },
            1200
        );

    }

    catch (error) {

        console.error(
            "Create meeting error:",
            error
        );

        message.textContent =
            "Unable to connect to server.";

    }

}


/* =====================================================
   FINAL MESSAGE
   ===================================================== */

console.log(
    "French Club Admin Dashboard JavaScript loaded successfully."
);
/* =====================================================
   SUBSCRIPTIONS / PAYMENTS MANAGEMENT
   ===================================================== */


document.addEventListener("DOMContentLoaded", function () {

    loadPayments();
    loadPaymentMembers();

    const addPaymentButton =
        document.getElementById("addPaymentButton");

    if (addPaymentButton) {

        addPaymentButton.addEventListener(
            "click",
            openPaymentForm
        );

    }


    const cancelPaymentButton =
        document.getElementById("cancelPaymentButton");

    if (cancelPaymentButton) {

        cancelPaymentButton.addEventListener(
            "click",
            closePaymentForm
        );

    }


    const paymentForm =
        document.getElementById("paymentForm");

    if (paymentForm) {

        paymentForm.addEventListener(
            "submit",
            savePayment
        );

    }

});


/* =====================================================
   OPEN PAYMENT FORM
   ===================================================== */

function openPaymentForm() {

    const container =
        document.getElementById(
            "paymentFormContainer"
        );

    if (!container) {
        return;
    }

    container.style.display = "block";

    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =====================================================
   CLOSE PAYMENT FORM
   ===================================================== */

function closePaymentForm() {

    const container =
        document.getElementById(
            "paymentFormContainer"
        );

    if (!container) {
        return;
    }

    container.style.display = "none";

}


/* =====================================================
   LOAD MEMBERS INTO PAYMENT FORM
   ===================================================== */

async function loadPaymentMembers() {

    const select =
        document.getElementById(
            "paymentMember"
        );

    if (!select) {
        return;
    }

    try {

        const response =
            await fetch(
                "/api/admin/members"
            );

        const data =
            await response.json();

        if (!response.ok) {
            return;
        }

        const members =
            data.members || [];

        select.innerHTML =
            '<option value="">Select member</option>';


        members.forEach(function (member) {

            const option =
                document.createElement("option");

            option.value =
                member.id;

            option.textContent =
                member.name +
                " (" +
                member.gr_number +
                ")";

            select.appendChild(option);

        });

    }

    catch (error) {

        console.error(
            "Payment members error:",
            error
        );

    }

}


/* =====================================================
   LOAD PAYMENTS
   ===================================================== */

async function loadPayments() {

    console.log("Loading payments...");

    const list =
        document.getElementById(
            "paymentsList"
        );

    if (!list) {
        return;
    }

    try {

        const response =
            await fetch(
                "/api/admin/subscriptions"
            );

        const data =
            await response.json();

        console.log(
            "Payments:",
            data
        );

        if (!response.ok) {

            list.innerHTML =
                "<p>Unable to load payments.</p>";

            return;
        }


        const payments =
            data.subscriptions || [];


        /* PAYMENT COUNT */

        const count =
            document.getElementById(
                "paymentCount"
            );

        if (count) {

            count.textContent =
                payments.length;

        }


        /* TOTAL MONEY */

        const total =
            document.getElementById(
                "totalPayments"
            );

        if (total) {

            const totalAmount =
                payments.reduce(
                    function (sum, payment) {

                        return (
                            sum +
                            Number(
                                payment.amount || 0
                            )
                        );

                    },
                    0
                );

            total.textContent =
                "GMD " +
                totalAmount.toLocaleString();

        }


        /* PAYMENT LIST */

        if (payments.length === 0) {

            list.innerHTML =
                "<p>No payments recorded yet.</p>";

            return;
        }


        list.innerHTML = "";


        payments.forEach(function (payment) {

            const card =
                document.createElement("div");

            card.style.padding =
                "15px";

            card.style.marginBottom =
                "10px";

            card.style.border =
                "1px solid #ddd";

            card.style.borderRadius =
                "10px";


            card.innerHTML = `

                <strong>
                    ${payment.member_name || "Unknown Member"}
                </strong>

                <p>
                    Amount:
                    <strong>
                        GMD ${Number(
                            payment.amount || 0
                        ).toLocaleString()}
                    </strong>
                </p>

                <p>
                    Date:
                    ${payment.payment_date || "N/A"}
                </p>

                <p>
                    Method:
                    ${payment.payment_method || "N/A"}
                </p>

                <p>
                    Status:
                    ${payment.status || "N/A"}
                </p>

                ${
                    payment.notes
                        ? `<p>Notes: ${payment.notes}</p>`
                        : ""
                }

            `;

            list.appendChild(card);

        });

    }

    catch (error) {

        console.error(
            "Payments error:",
            error
        );

        list.innerHTML =
            "<p>Unable to connect to server.</p>";

    }

}


/* =====================================================
   SAVE PAYMENT
   ===================================================== */

async function savePayment(event) {

    event.preventDefault();


    const memberId =
        document.getElementById(
            "paymentMember"
        ).value;

    const amount =
        document.getElementById(
            "paymentAmount"
        ).value;

    const paymentDate =
        document.getElementById(
            "paymentDate"
        ).value;

    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        ).value;

    const status =
        document.getElementById(
            "paymentStatus"
        ).value;

    const notes =
        document.getElementById(
            "paymentNotes"
        ).value.trim();

    const message =
        document.getElementById(
            "paymentMessage"
        );


    if (!memberId) {

        message.textContent =
            "Please select a member.";

        return;
    }


    if (!amount || Number(amount) <= 0) {

        message.textContent =
            "Please enter a valid amount.";

        return;
    }


    if (!paymentDate) {

        message.textContent =
            "Please select a payment date.";

        return;
    }


    message.textContent =
        "Saving payment...";


    try {

        const response =
            await fetch(
                "/api/admin/subscriptions",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            memberId:
                                Number(memberId),

                            amount:
                                Number(amount),

                            paymentDate:
                                paymentDate,

                            paymentMethod:
                                paymentMethod,

                            status:
                                status,

                            notes:
                                notes

                        })

                }
            );


        const data =
            await response.json();


        console.log(
            "Save payment response:",
            data
        );


        if (!response.ok) {

            message.textContent =
                data.message ||
                "Unable to save payment.";

            return;
        }


        message.textContent =
            "Payment saved successfully.";


        document
            .getElementById("paymentForm")
            .reset();


        await loadPayments();


        setTimeout(
            function () {

                closePaymentForm();

                message.textContent =
                    "";

            },
            1000
        );

    }

    catch (error) {

        console.error(
            "Save payment error:",
            error
        );

        message.textContent =
            "Unable to connect to server.";

    }

}