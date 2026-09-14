/* =========================================================
   NUSRAT FRENCH CLUB
   TEACHER COORDINATOR DASHBOARD
========================================================= */

const API_BASE = "/api";

let currentUser = null;
let allMembers = [];


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    initializeTeacherCoordinatorDashboard();

});


function initializeTeacherCoordinatorDashboard() {

    const storedMember =
        localStorage.getItem("frenchClubMember");


    if (!storedMember) {

        window.location.href = "/login.html";
        return;

    }


    try {

        currentUser =
            JSON.parse(storedMember);

    }
    catch (error) {

        console.error(
            "Unable to read login information:",
            error
        );

        localStorage.removeItem(
            "frenchClubMember"
        );

        window.location.href =
            "/login.html";

        return;

    }


    if (
        !currentUser ||
        currentUser.role !==
            "teacher_coordinator"
    ) {

        alert(
            "Teacher Coordinator access required."
        );

        window.location.href =
            "/login.html";

        return;

    }


    setupNavigation();
    setupLogout();
    setupRefreshButtons();
    setupMemberSearch();
    setupMeetingRefreshButton();

    updateWelcomeMessage();

    showSection("overview");

    loadDashboard();

}


/* =========================================================
   MANAGEMENT HEADERS
========================================================= */

function getManagementHeaders() {

    return {

        "Content-Type":
            "application/json",

        "x-admin-gr":
            String(
                currentUser.gr_number || ""
            )
                .trim()
                .toUpperCase()

    };

}


/* =========================================================
   WELCOME MESSAGE
========================================================= */

function updateWelcomeMessage() {

    const welcomeHeading =
        document.querySelector(
            ".welcome-card h2"
        );


    if (
        welcomeHeading &&
        currentUser.name
    ) {

        welcomeHeading.textContent =
            "Welcome, " +
            currentUser.name;

    }


    const topWelcome =
        document.getElementById(
            "welcomeMessage"
        );


    if (
        topWelcome &&
        currentUser.name
    ) {

        topWelcome.textContent =
            "Welcome, " +
            currentUser.name;

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            ".sidebar .nav-item"
        );


    navItems.forEach(function (item) {

        item.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                const target =
                    item.dataset.section;


                if (!target) {
                    return;
                }


                navItems.forEach(
                    function (navItem) {

                        navItem.classList.remove(
                            "active"
                        );

                    }
                );


                item.classList.add("active");


                showSection(target);

            }
        );

    });

}


/* =========================================================
   SHOW SECTION
========================================================= */

function showSection(sectionName) {

    const sections =
        document.querySelectorAll(
            ".dashboard-section"
        );


    sections.forEach(function (section) {

        section.classList.remove("active");

        section.style.display = "none";

    });


    const targetSection =
        document.getElementById(
            sectionName
        );


    if (!targetSection) {

        console.error(
            "Dashboard section not found:",
            sectionName
        );

        return;

    }


    targetSection.classList.add("active");

    targetSection.style.display = "block";


    /*
       Keep sidebar active state correct
    */

    const navItems =
        document.querySelectorAll(
            ".sidebar .nav-item"
        );


    navItems.forEach(function (item) {

        item.classList.toggle(
            "active",
            item.dataset.section === sectionName
        );

    });


    /*
       Refresh selected section
    */

    if (sectionName === "members") {

        loadMembers();

    }


    if (sectionName === "admins") {

        loadAdmins();

    }


    if (sectionName === "meetings") {

        loadMeetings();

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            localStorage.removeItem(
                "frenchClubMember"
            );


            window.location.href =
                "/login.html";

        }
    );

}


/* =========================================================
   REFRESH BUTTONS
========================================================= */

function setupRefreshButtons() {

    const refreshMembersButton =
        document.getElementById(
            "refreshMembersBtn"
        );


    if (refreshMembersButton) {

        refreshMembersButton.addEventListener(
            "click",
            function () {

                loadMembers();

            }
        );

    }


    const refreshAdminsButton =
        document.getElementById(
            "refreshAdminsBtn"
        );


    if (refreshAdminsButton) {

        refreshAdminsButton.addEventListener(
            "click",
            function () {

                loadAdmins();

            }
        );

    }

}


/* =========================================================
   MEMBER SEARCH
========================================================= */

function setupMemberSearch() {

    const searchInput =
        document.getElementById(
            "memberSearch"
        );


    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        "input",
        function () {

            filterMembers(
                searchInput.value
            );

        }
    );

}


/* =========================================================
   FILTER MEMBERS
========================================================= */

function filterMembers(searchTerm) {

    const term =
        String(searchTerm || "")
            .trim()
            .toLowerCase();


    if (!term) {

        renderMembers(allMembers);
        return;

    }


    const filteredMembers =
        allMembers.filter(
            function (member) {

                const name =
                    String(
                        member.name || ""
                    )
                        .toLowerCase();


                const grNumber =
                    String(
                        member.gr_number || ""
                    )
                        .toLowerCase();


                const phone =
                    String(
                        member.phone || ""
                    )
                        .toLowerCase();


                return (
                    name.includes(term) ||
                    grNumber.includes(term) ||
                    phone.includes(term)
                );

            }
        );


    renderMembers(filteredMembers);

}


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    await Promise.allSettled([

        loadMemberCount(),

        loadActiveMemberCount(),

        loadAdminCount(),

        loadMembers(),

        loadAdmins(),

        loadMeetings()

    ]);

}


/* =========================================================
   MEMBER COUNT
========================================================= */

async function loadMemberCount() {

    const element =
        document.getElementById(
            "totalMembers"
        );


    if (!element) {
        return;
    }


    try {

        const response =
            await fetch(
                API_BASE +
                "/teacher-coordinator/member-count",
                {
                    method: "GET",
                    headers:
                        getManagementHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load member count."
            );

        }


        element.textContent =
            data.total ?? 0;

    }
    catch (error) {

        console.error(
            "Member count error:",
            error
        );

        element.textContent =
            "—";

    }

}


/* =========================================================
   ACTIVE MEMBER COUNT
========================================================= */

async function loadActiveMemberCount() {

    const element =
        document.getElementById(
            "activeMembers"
        );


    if (!element) {
        return;
    }


    try {

        const response =
            await fetch(
                API_BASE +
                "/teacher-coordinator/members",
                {
                    method: "GET",
                    headers:
                        getManagementHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load members."
            );

        }


        const members =
            Array.isArray(data.members)
                ? data.members
                : [];


        const activeMembers =
            members.filter(
                function (member) {

                    return String(
                        member.status || ""
                    )
                        .toLowerCase() ===
                        "active";

                }
            );


        element.textContent =
            activeMembers.length;

    }
    catch (error) {

        console.error(
            "Active member count error:",
            error
        );

        element.textContent =
            "—";

    }

}


/* =========================================================
   ADMIN COUNT
========================================================= */

async function loadAdminCount() {

    const element =
        document.getElementById(
            "totalAdmins"
        );


    if (!element) {
        return;
    }


    try {

        const response =
            await fetch(
                API_BASE +
                "/teacher-coordinator/admin-count",
                {
                    method: "GET",
                    headers:
                        getManagementHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load administrator count."
            );

        }


        element.textContent =
            data.total ?? 0;

    }
    catch (error) {

        console.error(
            "Admin count error:",
            error
        );

        element.textContent =
            "—";

    }

}


/* =========================================================
   LOAD MEMBERS
========================================================= */

async function loadMembers() {

    const tableBody =
        document.getElementById(
            "membersTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML =
        `<tr>
            <td colspan="5">
                Loading members...
            </td>
        </tr>`;


    try {

        const response =
            await fetch(
                API_BASE +
                "/teacher-coordinator/members",
                {
                    method: "GET",
                    headers:
                        getManagementHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load members."
            );

        }


        allMembers =
            Array.isArray(data.members)
                ? data.members
                : [];


        renderMembers(allMembers);

    }
    catch (error) {

        console.error(
            "Load members error:",
            error
        );

        tableBody.innerHTML =
            `<tr>
                <td colspan="5">
                    Unable to load members.
                </td>
            </tr>`;

    }

}


/* =========================================================
   RENDER MEMBERS
========================================================= */

function renderMembers(members) {

    const tableBody =
        document.getElementById(
            "membersTableBody"
        );


    if (!tableBody) {
        return;
    }


    if (!members.length) {

        tableBody.innerHTML =
            `<tr>
                <td colspan="5">
                    No members found.
                </td>
            </tr>`;

        return;

    }


    tableBody.innerHTML = "";


    members.forEach(function (member) {

        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>
                ${escapeHtml(member.id)}
            </td>

            <td>
                ${escapeHtml(member.name)}
            </td>

            <td>
                ${escapeHtml(member.gr_number)}
            </td>

            <td>
                ${escapeHtml(member.status)}
            </td>

            <td>

                <button
                    type="button"
                    class="promote-member-btn"
                    data-id="${escapeHtml(member.id)}"
                    data-gr="${escapeHtml(member.gr_number)}"
                >
                    Promote to Admin
                </button>

                <button
                    type="button"
                    class="remove-member-btn"
                    data-id="${escapeHtml(member.id)}"
                >
                    Remove
                </button>

            </td>
        `;


        tableBody.appendChild(row);

    });


    setupMemberActionButtons();

}


/* =========================================================
   MEMBER ACTION BUTTONS
========================================================= */

function setupMemberActionButtons() {

    const promoteButtons =
        document.querySelectorAll(
            ".promote-member-btn"
        );


    promoteButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                promoteMember(
                    button.dataset.gr,
                    button
                );

            }
        );

    });


    const removeButtons =
        document.querySelectorAll(
            ".remove-member-btn"
        );


    removeButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                removeMember(
                    button.dataset.id,
                    button
                );

            }
        );

    });

}


/* =========================================================
   PROMOTE MEMBER
========================================================= */

async function promoteMember(
    grNumber,
    button
) {

    if (!grNumber) {
        return;
    }


    const confirmed =
        confirm(
            "Promote " +
            grNumber +
            " to Administrator?"
        );


    if (!confirmed) {
        return;
    }


    button.disabled = true;


    try {

        const response =
            await fetch(
                API_BASE +
                "/admin/promote-members",
                {
                    method: "POST",

                    headers:
                        getManagementHeaders(),

                    body: JSON.stringify({
                        grNumbers: [
                            grNumber
                        ]
                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to promote member."
            );

        }


        alert(
            data.message ||
            "Member promoted successfully."
        );


        await loadDashboard();

    }
    catch (error) {

        console.error(
            "Promote member error:",
            error
        );

        alert(
            error.message ||
            "Unable to promote member."
        );

        button.disabled = false;

    }

}


/* =========================================================
   REMOVE MEMBER
========================================================= */

async function removeMember(
    memberId,
    button
) {

    if (!memberId) {
        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to remove this member?"
        );


    if (!confirmed) {
        return;
    }


    button.disabled = true;


    try {

        const response =
            await fetch(
                API_BASE +
                "/admin/members/" +
                encodeURIComponent(memberId),
                {
                    method: "DELETE",
                    headers:
                        getManagementHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to remove member."
            );

        }


        alert(
            data.message ||
            "Member removed successfully."
        );


        await loadDashboard();

    }
    catch (error) {

        console.error(
            "Remove member error:",
            error
        );

        alert(
            error.message ||
            "Unable to remove member."
        );

        button.disabled = false;

    }

}


/* =========================================================
   LOAD ADMINISTRATORS
========================================================= */

async function loadAdmins() {

    const tableBody =
        document.getElementById(
            "adminsTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML =
        `<tr>
            <td colspan="5">
                Loading administrators...
            </td>
        </tr>`;


    try {

        const response =
            await fetch(
                API_BASE +
                "/teacher-coordinator/admins",
                {
                    method: "GET",
                    headers:
                        getManagementHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load administrators."
            );

        }


        const admins =
            Array.isArray(data.admins)
                ? data.admins
                : [];


        if (!admins.length) {

            tableBody.innerHTML =
                `<tr>
                    <td colspan="5">
                        No administrators found.
                    </td>
                </tr>`;

            return;

        }


        tableBody.innerHTML = "";


        admins.forEach(function (admin) {

            const row =
                document.createElement("tr");


            let actionHtml = "";


            if (
                Number(admin.id) !==
                Number(currentUser.id)
            ) {

                actionHtml = `
                    <button
                        type="button"
                        class="remove-admin-btn"
                        data-id="${escapeHtml(admin.id)}"
                    >
                        Remove
                    </button>
                `;

            }
            else {

                actionHtml =
                    `<span>Current account</span>`;

            }


            row.innerHTML = `
                <td>
                    ${escapeHtml(admin.id)}
                </td>

                <td>
                    ${escapeHtml(admin.name)}
                </td>

                <td>
                    ${escapeHtml(admin.gr_number)}
                </td>

                <td>
                    ${escapeHtml(admin.role)}
                </td>

                <td>
                    ${actionHtml}
                </td>
            `;


            tableBody.appendChild(row);

        });


        setupAdminActionButtons();

    }
    catch (error) {

        console.error(
            "Load administrators error:",
            error
        );

        tableBody.innerHTML =
            `<tr>
                <td colspan="5">
                    Unable to load administrators.
                </td>
            </tr>`;

    }

}


/* =========================================================
   ADMIN ACTION BUTTONS
========================================================= */

function setupAdminActionButtons() {

    const buttons =
        document.querySelectorAll(
            ".remove-admin-btn"
        );


    buttons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                removeAdmin(
                    button.dataset.id,
                    button
                );

            }
        );

    });

}


/* =========================================================
   REMOVE ADMIN
========================================================= */

async function removeAdmin(
    adminId,
    button
) {

    if (!adminId) {
        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to remove this administrator?"
        );


    if (!confirmed) {
        return;
    }


    button.disabled = true;


    try {

        const response =
            await fetch(
                API_BASE +
                "/teacher-coordinator/admins/" +
                encodeURIComponent(adminId),
                {
                    method: "DELETE",
                    headers:
                        getManagementHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to remove administrator."
            );

        }


        alert(
            data.message ||
            "Administrator removed successfully."
        );


        await loadDashboard();

    }
    catch (error) {

        console.error(
            "Remove administrator error:",
            error
        );

        alert(
            error.message ||
            "Unable to remove administrator."
        );

        button.disabled = false;

    }

}


/* =========================================================
   LOAD MEETINGS
========================================================= */

async function loadMeetings() {

    const tableBody =
        document.getElementById(
            "meetingsTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML =
        `<tr>
            <td colspan="5">
                Loading meetings...
            </td>
        </tr>`;


    try {

        const response =
            await fetch(
                API_BASE +
                "/teacher-coordinator/meetings",
                {
                    method: "GET",
                    headers:
                        getManagementHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load meetings."
            );

        }


        const meetings =
            Array.isArray(data.meetings)
                ? data.meetings
                : [];


        renderMeetings(meetings);

    }
    catch (error) {

        console.error(
            "Load meetings error:",
            error
        );


        tableBody.innerHTML =
            `<tr>
                <td colspan="5">
                    Unable to load meetings.
                </td>
            </tr>`;

    }

}


/* =========================================================
   RENDER MEETINGS
========================================================= */

function renderMeetings(meetings) {

    const tableBody =
        document.getElementById(
            "meetingsTableBody"
        );


    if (!tableBody) {
        return;
    }


    if (!meetings.length) {

        tableBody.innerHTML =
            `<tr>
                <td colspan="5">
                    No meetings found.
                </td>
            </tr>`;

        return;

    }


    tableBody.innerHTML = "";


    meetings.forEach(function (meeting) {

        const row =
            document.createElement("tr");


        const meetingDate =
            formatMeetingDate(
                meeting.meeting_date
            );


        const createdDate =
            formatMeetingDate(
                meeting.created_at
            );


        row.innerHTML = `
            <td>
                ${escapeHtml(meeting.id)}
            </td>

            <td>
                ${escapeHtml(meeting.title)}
            </td>

            <td>
                ${escapeHtml(meetingDate)}
            </td>

            <td>
                ${escapeHtml(
                    meeting.description || "—"
                )}
            </td>

            <td>
                ${escapeHtml(createdDate)}
            </td>
        `;


        tableBody.appendChild(row);

    });

}


/* =========================================================
   FORMAT MEETING DATE
========================================================= */

function formatMeetingDate(value) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {
        return String(value);
    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   MEETINGS REFRESH BUTTON
========================================================= */

function setupMeetingRefreshButton() {

    const button =
        document.getElementById(
            "refreshMeetingsBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            loadMeetings();

        }
    );

}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
