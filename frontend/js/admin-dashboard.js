/* =====================================================
   FRENCH CLUB MANAGEMENT SYSTEM
   EXECUTIVE DASHBOARD
   ===================================================== */


/* =====================================================
   GLOBAL MEMBER DATA
   ===================================================== */

let allMembers = [];


/* =====================================================
   ADMIN API HEADERS
   ===================================================== */

function adminHeaders() {

    let member = null;

    try {

        member = JSON.parse(
            localStorage.getItem("frenchClubMember") ||
            localStorage.getItem("loggedInMember") ||
            "null"
        );

    } catch (error) {

        console.error(
            "Unable to read admin login:",
            error
        );

        return {};

    }

    if (!member || !member.gr_number) {
        return {};
    }

    return {
        "x-admin-gr": member.gr_number
    };

}


/* =====================================================
   ADMIN ACCESS CHECK
   ===================================================== */

(function checkAdminAccess() {

    const memberData =
        localStorage.getItem("frenchClubMember");

    if (!memberData) {

        alert(
            "Please log in as an administrator."
        );

        window.location.href =
            "/login.html";

        return;

    }

    try {

        const member =
            JSON.parse(memberData);

        if (
            member.role !== "admin" ||
            member.status !== "Active"
        ) {

            alert(
                "Access denied. Administrator privileges are required."
            );

            localStorage.removeItem(
                "frenchClubMember"
            );

            window.location.href =
                "/member-dashboard.html";

            return;

        }

    } catch (error) {

        console.error(
            "Admin security check failed:",
            error
        );

        localStorage.removeItem(
            "frenchClubMember"
        );

        window.location.href =
            "/login.html";

    }

})();


/* =====================================================
   PAGE LOAD
   ===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "French Club Executive Dashboard loaded."
        );

        loadMembers();
        loadMeetings();
        loadAttendanceCount();
        loadPayments();
        loadPaymentMembers();

        setupMemberSearch();

        setupPaymentButton();
        setupPaymentForm();
        setupPaymentCancel();

        setupMeetingEvents();
        setupLogout();

    }
);


/* =====================================================
   SECURITY / HTML HELPER
   ===================================================== */

function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =====================================================
   MEMBER SEARCH / FILTER
   ===================================================== */

function setupMemberSearch() {

    const searchInput =
        document.getElementById(
            "memberSearch"
        );

    const statusFilter =
        document.getElementById(
            "memberStatusFilter"
        );

    const clearButton =
        document.getElementById(
            "clearMemberSearch"
        );

    console.log(
        "Member search setup:",
        {
            searchInput: !!searchInput,
            statusFilter: !!statusFilter,
            clearButton: !!clearButton
        }
    );


    /* ---------------------------------------------
       SEARCH
       --------------------------------------------- */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                filterMembers();

            }
        );

    }


    /* ---------------------------------------------
       STATUS FILTER
       --------------------------------------------- */

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            function () {

                filterMembers();

            }
        );

    }


    /* ---------------------------------------------
       CLEAR BUTTON
       --------------------------------------------- */

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                console.log(
                    "Clear member search clicked."
                );

                if (searchInput) {

                    searchInput.value = "";

                }

                if (statusFilter) {

                    statusFilter.value = "all";

                }

                renderMembers(
                    allMembers
                );

            }
        );

    }

}


/* =====================================================
   FILTER MEMBERS
   ===================================================== */

function filterMembers() {

    const searchInput =
        document.getElementById(
            "memberSearch"
        );

    const statusFilter =
        document.getElementById(
            "memberStatusFilter"
        );

    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "all";


    const filteredMembers =
        allMembers.filter(
            function (member) {

                const name =
                    String(
                        member.name || ""
                    ).toLowerCase();

                const grNumber =
                    String(
                        member.gr_number || ""
                    ).toLowerCase();

                const className =
                    String(
                        member.class_name || ""
                    ).toLowerCase();

                const phone =
                    String(
                        member.phone || ""
                    ).toLowerCase();

                const status =
                    String(
                        member.status || ""
                    );


                const matchesSearch =
                    !searchTerm ||
                    name.includes(searchTerm) ||
                    grNumber.includes(searchTerm) ||
                    className.includes(searchTerm) ||
                    phone.includes(searchTerm);


                const matchesStatus =
                    selectedStatus === "all" ||
                    status.toLowerCase() ===
                        selectedStatus.toLowerCase();


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    console.log(
        "Filtered members:",
        filteredMembers.length
    );


    renderMembers(
        filteredMembers
    );

}


/* =====================================================
   RENDER MEMBERS
   ===================================================== */

function renderMembers(members) {

    const table =
        document.getElementById(
            "membersTable"
        );

    if (!table) {

        console.error(
            "Members table not found."
        );

        return;

    }


    table.innerHTML = "";


    if (!Array.isArray(members) ||
        members.length === 0) {

        table.innerHTML =
            "<tr>" +
            "<td colspan='8' style='text-align:center;padding:20px;'>" +
            "No matching members found." +
            "</td>" +
            "</tr>";

        return;

    }


    members.forEach(
        function (member, index) {

            const row =
                document.createElement(
                    "tr"
                );


            let dateJoined =
                "N/A";


            if (member.date_joined) {

                const date =
                    new Date(
                        member.date_joined
                    );

                if (
                    !isNaN(
                        date.getTime()
                    )
                ) {

                    dateJoined =
                        date.toLocaleDateString();

                }

            }


            row.innerHTML = `
                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHTML(
                        member.name
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        member.gr_number
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        member.class_name
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        member.phone
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        member.status
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        dateJoined
                    )}
                </td>

                <td>

                    ${
                        member.role === "admin"

                            ? `
                                <span
                                    style="
                                        color:#777;
                                        font-weight:bold;
                                    "
                                >
                                    Administrator
                                </span>
                            `

                            : `
                                <button
                                    type="button"
                                    class="reset-password-btn"
                                    data-member-id="${member.id}"
                                    data-member-name="${escapeHTML(member.name)}"
                                    style="
                                        background:#007bff;
                                        color:white;
                                        border:none;
                                        padding:8px 12px;
                                        border-radius:6px;
                                        cursor:pointer;
                                        margin-right:6px;
                                    "
                                >
                                    🔑 Reset Password
                                </button>

                                <button
                                    type="button"
                                    class="remove-member-btn"
                                    data-member-id="${member.id}"
                                    style="
                                        background:#dc3545;
                                        color:white;
                                        border:none;
                                        padding:8px 12px;
                                        border-radius:6px;
                                        cursor:pointer;
                                    "
                                >
                                    🗑️ Remove
                                </button>
                            `
                    }

                </td>
            `;


            table.appendChild(
                row
            );

        }
    );


    setupRemoveMemberButtons();
    setupResetPasswordButtons();

}


/* =====================================================
   LOAD MEMBERS
   ===================================================== */

async function loadMembers() {

    console.log(
        "Loading members..."
    );


    const table =
        document.getElementById(
            "membersTable"
        );


    if (!table) {

        console.error(
            "Members table not found."
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/admin/members",
                {
                    headers:
                        adminHeaders()
                }
            );


        const data =
            await response.json();


        console.log(
            "Members:",
            data
        );


        if (!response.ok) {

            table.innerHTML =
                "<tr><td colspan='8'>Unable to load members.</td></tr>";

            return;

        }


        allMembers =
            Array.isArray(
                data.members
            )
                ? data.members
                : [];


        const total =
            document.getElementById(
                "totalMembers"
            );


        if (total) {

            total.textContent =
                allMembers.length;

        }


        const active =
            document.getElementById(
                "activeMembers"
            );


        if (active) {

            active.textContent =
                allMembers.filter(
                    function (member) {

                        return (
                            member.status ===
                                "Active" ||
                            member.status ===
                                "active"
                        );

                    }
                ).length;

        }


        renderMembers(
            allMembers
        );

    }


    catch (error) {

        console.error(
            "Members error:",
            error
        );


        table.innerHTML =
            "<tr><td colspan='8'>Unable to connect to server.</td></tr>";

    }

}


/* =====================================================
   REMOVE MEMBER
   ===================================================== */

async function removeMember(memberId) {

    if (!memberId) {
        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to remove this member?\n\n" +
            "This will also remove their attendance and payment records."
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/admin/members/" +
                encodeURIComponent(
                    memberId
                ),
                {
                    method: "DELETE",
                    headers:
                        adminHeaders()
                }
            );


        const data =
            await response.json();


        console.log(
            "Remove member:",
            data
        );


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to remove member."
            );

            return;

        }


        alert(
            "Member removed successfully."
        );


        await loadMembers();

        await loadAttendanceCount();

        await loadPayments();

        await loadPaymentMembers();

    }


    catch (error) {

        console.error(
            "Remove member error:",
            error
        );


        alert(
            "Unable to connect to server."
        );

    }

}


/* =====================================================
   REMOVE MEMBER BUTTONS
   ===================================================== */

function setupRemoveMemberButtons() {

    const buttons =
        document.querySelectorAll(
            ".remove-member-btn"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const memberId =
                        Number(
                            button.dataset.memberId
                        );


                    removeMember(
                        memberId
                    );

                }
            );

        }
    );

}


/* =====================================================
   RESET PASSWORD BUTTONS
   ===================================================== */

function setupResetPasswordButtons() {

    const buttons =
        document.querySelectorAll(
            ".reset-password-btn"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                async function () {

                    const memberId =
                        button.dataset.memberId;

                    const memberName =
                        button.dataset.memberName;


                    if (!memberId) {

                        alert(
                            "Invalid member ID."
                        );

                        return;

                    }


                    const newPassword =
                        prompt(
                            "Enter a new password for " +
                            memberName +
                            ":"
                        );


                    if (
                        newPassword ===
                        null
                    ) {

                        return;

                    }


                    if (
                        newPassword.length <
                        6
                    ) {

                        alert(
                            "Password must be at least 6 characters."
                        );

                        return;

                    }


                    try {

                        button.disabled =
                            true;

                        button.textContent =
                            "Resetting...";


                        const response =
                            await fetch(
                                "/api/admin/members/" +
                                encodeURIComponent(
                                    memberId
                                ) +
                                "/reset-password",
                                {
                                    method:
                                        "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json",

                                        ...adminHeaders()
                                    },

                                    body:
                                        JSON.stringify({
                                            newPassword:
                                                newPassword
                                        })
                                }
                            );


                        const data =
                            await response.json();


                        if (!response.ok) {

                            alert(
                                data.message ||
                                "Unable to reset password."
                            );

                            return;

                        }


                        alert(
                            "Password reset successfully for " +
                            memberName +
                            ".\n\nNew password: " +
                            newPassword
                        );

                    }


                    catch (error) {

                        console.error(
                            "Reset password error:",
                            error
                        );


                        alert(
                            "Unable to connect to server."
                        );

                    }


                    finally {

                        button.disabled =
                            false;

                        button.textContent =
                            "🔑 Reset Password";

                    }

                }
            );

        }
    );

}


/* =====================================================
   MEETING EVENTS
   ===================================================== */

function setupMeetingEvents() {

    const createButton =
        document.getElementById(
            "createMeetingButton"
        );


    if (createButton) {

        createButton.addEventListener(
            "click",
            openMeetingForm
        );

    }


    const cancelButton =
        document.getElementById(
            "cancelMeetingButton"
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeMeetingForm
        );

    }


    const meetingForm =
        document.getElementById(
            "meetingForm"
        );


    if (meetingForm) {

        meetingForm.addEventListener(
            "submit",
            createMeeting
        );

    }

}


/* =====================================================
   LOAD MEETINGS
   ===================================================== */

async function loadMeetings() {

    console.log(
        "Loading meetings..."
    );


    const list =
        document.getElementById(
            "meetingsList"
        );


    if (!list) {
        return;
    }


    list.innerHTML =
        "<p>Loading meetings...</p>";


    try {

        const response =
            await fetch(
                "/api/admin/meetings",
                {
                    headers:
                        adminHeaders()
                }
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
            Array.isArray(
                data.meetings
            )
                ? data.meetings
                : [];


        const total =
            document.getElementById(
                "totalMeetings"
            );


        if (total) {

            total.textContent =
                meetings.length;

        }


        list.innerHTML = "";


        if (meetings.length === 0) {

            list.innerHTML =
                "<p>No meetings created yet.</p>";

            return;

        }


        meetings.forEach(
            function (meeting) {

                const card =
                    document.createElement(
                        "div"
                    );


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


                let displayDate =
                    meeting.meeting_date ||
                    "No date";


                if (
                    meeting.meeting_date
                ) {

                    const date =
                        new Date(
                            meeting.meeting_date +
                            "T00:00:00"
                        );


                    if (
                        !isNaN(
                            date.getTime()
                        )
                    ) {

                        displayDate =
                            date.toLocaleDateString();

                    }

                }


                card.innerHTML = `
                    <h3>
                        📅
                        ${escapeHTML(
                            meeting.title ||
                            "Untitled Meeting"
                        )}
                    </h3>

                    <p>
                        <strong>Meeting Number:</strong>
                        ${meeting.id}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${escapeHTML(
                            displayDate
                        )}
                    </p>

                    <p>
                        <strong>Description:</strong>
                        ${escapeHTML(
                            meeting.description ||
                            "No description provided."
                        )}
                    </p>

                    <button
                        type="button"
                        class="submit-btn attendance-button"
                    >
                        👥 Take Attendance
                    </button>

                    <div
                        class="attendance-area"
                        style="display:none;margin-top:20px;"
                    ></div>
                `;


                list.appendChild(
                    card
                );


                const button =
                    card.querySelector(
                        ".attendance-button"
                    );


                const area =
                    card.querySelector(
                        ".attendance-area"
                    );


                if (
                    button &&
                    area
                ) {

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
   MEETING FORM
   ===================================================== */

function openMeetingForm() {

    const container =
        document.getElementById(
            "meetingFormContainer"
        );


    if (!container) {
        return;
    }


    container.style.display =
        "block";


    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


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


async function createMeeting(event) {

    event.preventDefault();


    const title =
        document.getElementById(
            "meetingTitle"
        );


    const meetingDate =
        document.getElementById(
            "meetingDate"
        );


    const description =
        document.getElementById(
            "meetingDescription"
        );


    const message =
        document.getElementById(
            "meetingMessage"
        );


    if (
        !title ||
        !meetingDate
    ) {
        return;
    }


    if (
        !title.value.trim()
    ) {

        if (message) {

            message.textContent =
                "Please enter a meeting title.";

        }

        return;

    }


    if (
        !meetingDate.value
    ) {

        if (message) {

            message.textContent =
                "Please select a meeting date.";

        }

        return;

    }


    if (message) {

        message.textContent =
            "Creating meeting...";

    }


    try {

        const response =
            await fetch(
                "/api/admin/meetings",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        ...adminHeaders()
                    },

                    body:
                        JSON.stringify({

                            title:
                                title.value.trim(),

                            meetingDate:
                                meetingDate.value,

                            description:
                                description
                                    ? description.value.trim()
                                    : ""

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            if (message) {

                message.textContent =
                    data.message ||
                    "Unable to create meeting.";

            }

            return;

        }


        if (message) {

            message.textContent =
                "Meeting created successfully.";

        }


        const form =
            document.getElementById(
                "meetingForm"
            );


        if (form) {
            form.reset();
        }


        await loadMeetings();


        setTimeout(
            function () {

                closeMeetingForm();

                if (message) {
                    message.textContent = "";
                }

            },
            1200
        );

    }


    catch (error) {

        console.error(
            "Create meeting error:",
            error
        );


        if (message) {

            message.textContent =
                "Unable to connect to server.";

        }

    }

}


/* =====================================================
   ATTENDANCE
   ===================================================== */

async function loadAttendance(
    meetingId,
    container
) {

    try {

        const response =
            await fetch(
                "/api/admin/meetings/" +
                encodeURIComponent(
                    meetingId
                ) +
                "/attendance",
                {
                    headers:
                        adminHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            container.innerHTML =
                "<p>Unable to load attendance.</p>";

            return;

        }


        const members =
            Array.isArray(
                data.members
            )
                ? data.members
                : [];


        if (
            members.length === 0
        ) {

            container.innerHTML =
                "<p>No members registered.</p>";

            return;

        }


        container.innerHTML =
            "<h3>👥 Member Attendance</h3>";


        members.forEach(
            function (member) {

                const row =
                    document.createElement(
                        "div"
                    );


                row.style.padding =
                    "10px";


                row.style.borderBottom =
                    "1px solid #ddd";


                const currentStatus =
                    member.attendance_status ||
                    "Absent";


                row.innerHTML = `
                    <strong>
                        ${escapeHTML(
                            member.name
                        )}
                    </strong>

                    (
                    ${escapeHTML(
                        member.gr_number
                    )}
                    )

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


                container.appendChild(
                    row
                );


                const select =
                    row.querySelector(
                        ".attendance-status"
                    );


                const saveButton =
                    row.querySelector(
                        ".save-attendance"
                    );


                if (select) {

                    select.value =
                        currentStatus;

                }


                if (saveButton) {

                    saveButton.addEventListener(
                        "click",
                        async function () {

                            const selectedStatus =
                                select.value;


                            saveButton.disabled =
                                true;


                            saveButton.textContent =
                                "Saving...";


                            try {

                                const saveResponse =
                                    await fetch(
                                        "/api/admin/meetings/" +
                                        encodeURIComponent(
                                            meetingId
                                        ) +
                                        "/attendance",
                                        {
                                            method:
                                                "POST",

                                            headers: {
                                                "Content-Type":
                                                    "application/json",

                                                ...adminHeaders()
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
                                    "Save attendance:",
                                    saveData
                                );


                                if (
                                    !saveResponse.ok
                                ) {

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


                                saveButton.disabled =
                                    false;


                                await loadAttendanceCount();

                            }


                            catch (error) {

                                console.error(
                                    "Attendance save error:",
                                    error
                                );


                                alert(
                                    "Unable to connect to server."
                                );


                                saveButton.disabled =
                                    false;


                                saveButton.textContent =
                                    "Save";

                            }

                        }
                    );

                }

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
   ATTENDANCE COUNT
   ===================================================== */

async function loadAttendanceCount() {

    const element =
        document.getElementById(
            "attendanceCount"
        );


    if (!element) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/admin/attendance/count",
                {
                    headers:
                        adminHeaders()
                }
            );


        const data =
            await response.json();


        console.log(
            "Attendance count:",
            data
        );


        if (response.ok) {

            element.textContent =
                data.count || 0;

        }

    }


    catch (error) {

        console.error(
            "Attendance count error:",
            error
        );

    }

}


/* =====================================================
   PAYMENT BUTTON
   ===================================================== */

function setupPaymentButton() {

    const button =
        document.getElementById(
            "addPaymentButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            openPaymentForm();

            loadPaymentMembers();

        }
    );

}


function openPaymentForm() {

    const container =
        document.getElementById(
            "paymentFormContainer"
        );


    if (!container) {
        return;
    }


    container.style.display =
        "block";


    container.style.position =
        "relative";


    container.style.zIndex =
        "9999";


    container.style.background =
        "white";


    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


function closePaymentForm() {

    const container =
        document.getElementById(
            "paymentFormContainer"
        );


    if (!container) {
        return;
    }


    container.style.display =
        "none";

}


function setupPaymentCancel() {

    const button =
        document.getElementById(
            "cancelPaymentButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            closePaymentForm();


            const form =
                document.getElementById(
                    "paymentForm"
                );


            if (form) {
                form.reset();
            }


            const message =
                document.getElementById(
                    "paymentMessage"
                );


            if (message) {
                message.textContent = "";
            }

        }
    );

}


/* =====================================================
   LOAD PAYMENT MEMBERS
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
                "/api/admin/members",
                {
                    headers:
                        adminHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {
            return;
        }


        const members =
            Array.isArray(
                data.members
            )
                ? data.members
                : [];


        select.innerHTML =
            '<option value="">Select member</option>';


        members.forEach(
            function (member) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    member.id;


                option.textContent =
                    member.name +
                    " (" +
                    (
                        member.gr_number ||
                        "N/A"
                    ) +
                    ")";


                select.appendChild(
                    option
                );

            }
        );

    }


    catch (error) {

        console.error(
            "Payment members error:",
            error
        );

    }

}


/* =====================================================
   PAYMENT FORM
   ===================================================== */

function setupPaymentForm() {

    const form =
        document.getElementById(
            "paymentForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        createPayment
    );

}


async function createPayment(event) {

    event.preventDefault();


    console.log(
        "Creating payment..."
    );


    const form =
        event.target;


    const member =
        document.getElementById(
            "paymentMember"
        );


    const amount =
        document.getElementById(
            "paymentAmount"
        );


    const date =
        document.getElementById(
            "paymentDate"
        );


    const method =
        document.getElementById(
            "paymentMethod"
        );


    const status =
        document.getElementById(
            "paymentStatus"
        );


    const notes =
        document.getElementById(
            "paymentNotes"
        );


    const message =
        document.getElementById(
            "paymentMessage"
        );


    if (
        !member ||
        !amount ||
        !date ||
        !method
    ) {

        console.error(
            "Payment form fields are missing."
        );

        return;

    }


    if (!member.value) {

        if (message) {

            message.textContent =
                "Please select a member.";

        }

        return;

    }


    if (
        !amount.value ||
        Number(amount.value) <= 0
    ) {

        if (message) {

            message.textContent =
                "Please enter a valid payment amount.";

        }

        return;

    }


    if (!date.value) {

        if (message) {

            message.textContent =
                "Please select the payment date.";

        }

        return;

    }


    if (message) {

        message.textContent =
            "Saving payment...";

    }


    try {

        const response =
            await fetch(
                "/api/admin/subscriptions",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        ...adminHeaders()
                    },

                    body:
                        JSON.stringify({

                            memberId:
                                Number(
                                    member.value
                                ),

                            amount:
                                Number(
                                    amount.value
                                ),

                            paymentDate:
                                date.value,

                            paymentMethod:
                                method.value,

                            status:
                                status
                                    ? status.value
                                    : "Paid",

                            notes:
                                notes
                                    ? notes.value.trim()
                                    : ""

                        })

                }
            );


        const data =
            await response.json();


        console.log(
            "Payment response:",
            data
        );


        if (!response.ok) {

            if (message) {

                message.textContent =
                    data.message ||
                    "Unable to save payment.";

            }

            return;

        }


        if (message) {

            message.textContent =
                "Payment recorded successfully.";

        }


        form.reset();


        await loadPayments();


        setTimeout(
            function () {

                closePaymentForm();

                if (message) {
                    message.textContent = "";
                }

            },
            1200
        );

    }


    catch (error) {

        console.error(
            "Create payment error:",
            error
        );


        if (message) {

            message.textContent =
                "Unable to connect to server.";

        }

    }

}


/* =====================================================
   PAYMENT HISTORY
   ===================================================== */

async function loadPayments() {

    console.log(
        "Loading payments..."
    );


    const list =
        document.getElementById(
            "paymentsList"
        );


    if (!list) {
        return;
    }


    list.innerHTML =
        "<p>Loading payments...</p>";


    try {

        const response =
            await fetch(
                "/api/admin/subscriptions",
                {
                    headers:
                        adminHeaders()
                }
            );


        const data =
            await response.json();


        console.log(
            "Payments:",
            data
        );


        if (!response.ok) {

            list.innerHTML =
                "<p>Unable to load payment history.</p>";

            return;

        }


        const payments =
            Array.isArray(
                data.subscriptions
            )
                ? data.subscriptions
                : [];


        list.innerHTML = "";


        let total = 0;


        const paymentCount =
            document.getElementById(
                "paymentCount"
            );


        if (paymentCount) {

            paymentCount.textContent =
                payments.length;

        }


        if (
            payments.length === 0
        ) {

            list.innerHTML =
                "<p>No payments recorded yet.</p>";


            updatePaymentTotal(
                0
            );


            return;

        }


        payments.forEach(
            function (payment) {

                const amount =
                    Number(
                        payment.amount
                    ) || 0;


                total += amount;


                const card =
                    document.createElement(
                        "div"
                    );


                card.style.padding =
                    "15px";


                card.style.marginBottom =
                    "10px";


                card.style.border =
                    "1px solid #ddd";


                card.style.borderRadius =
                    "10px";


                card.style.background =
                    "#fff";


                card.innerHTML = `
                    <strong>
                        ${escapeHTML(
                            payment.name ||
                            "Unknown Member"
                        )}
                    </strong>

                    <p>
                        <strong>GR Number:</strong>
                        ${escapeHTML(
                            payment.gr_number ||
                            "N/A"
                        )}
                    </p>

                    <p>
                        <strong>Class:</strong>
                        ${escapeHTML(
                            payment.class_name ||
                            "N/A"
                        )}
                    </p>

                    <p>
                        <strong>Amount:</strong>
                        GMD ${amount.toFixed(2)}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${escapeHTML(
                            payment.payment_date ||
                            "N/A"
                        )}
                    </p>

                    <p>
                        <strong>Method:</strong>
                        ${escapeHTML(
                            payment.payment_method ||
                            "Cash"
                        )}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${escapeHTML(
                            payment.status ||
                            "Paid"
                        )}
                    </p>

                    ${
                        payment.notes
                            ? `
                                <p>
                                    <strong>Notes:</strong>
                                    ${escapeHTML(
                                        payment.notes
                                    )}
                                </p>
                            `
                            : ""
                    }
                `;


                list.appendChild(
                    card
                );

            }
        );


        updatePaymentTotal(
            total
        );

    }


    catch (error) {

        console.error(
            "Payment history error:",
            error
        );


        list.innerHTML =
            "<p>Unable to connect to server.</p>";

    }

}


/* =====================================================
   PAYMENT TOTAL
   ===================================================== */

function updatePaymentTotal(total) {

    const element =
        document.getElementById(
            "totalPayments"
        );


    if (!element) {
        return;
    }


    element.textContent =
        "GMD " +
        Number(total).toFixed(2);

}


/* =====================================================
   LOGOUT
   ===================================================== */

function setupLogout() {

    const logout =
        document.getElementById(
            "adminLogout"
        );


    if (!logout) {
        return;
    }


    logout.addEventListener(
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


/* =====================================================
   END
   ===================================================== */