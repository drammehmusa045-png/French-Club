/* =========================================
   NUSRATFRENCH CLUB
   MEMBER / ADMIN / TEACHER COORDINATOR LOGIN
   ========================================= */

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const grNumber =
        document.getElementById("grNumber").value.trim();

    const password =
        document.getElementById("password").value;


    if (!grNumber || !password) {

        loginMessage.textContent =
            "Please enter your GR number and password.";

        loginMessage.style.color = "red";

        return;
    }


    loginMessage.textContent =
        "Logging in...";

    loginMessage.style.color =
        "blue";


    try {

        const response = await fetch(
            "/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    grNumber: grNumber,
                    password: password
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            loginMessage.textContent =
                data.message || "Login failed.";

            loginMessage.style.color =
                "red";

            return;
        }


        /* =========================================
           VERIFY LOGIN RESPONSE
        ========================================= */

        if (!data.member) {

            console.error(
                "Login response is missing member information:",
                data
            );

            loginMessage.textContent =
                "Login response was invalid. Please contact the club administrator.";

            loginMessage.style.color =
                "red";

            return;
        }


        /* =========================================
           GET ROLE FROM SERVER RESPONSE
           
           The backend explicitly returns:
           
           role: member.role || "member"
           
           Therefore use data.role as the primary
           source instead of relying only on
           data.member.role.
        ========================================= */

        const role =
            String(
                data.role ||
                data.member.role ||
                "member"
            )
                .trim()
                .toLowerCase();


        /* =========================================
           KEEP THE ROLE CONSISTENT
        ========================================= */

        data.member.role =
            role;


        /* =========================================
           SAVE MEMBER INFORMATION
        ========================================= */

        localStorage.setItem(
            "frenchClubMember",
            JSON.stringify(data.member)
        );


        /* =========================================
           DEBUG LOGIN ROLE
        ========================================= */

        console.log(
            "Login successful.",
            {
                grNumber: data.member.gr_number,
                name: data.member.name,
                role: role,
                status: data.member.status
            }
        );


        loginMessage.textContent =
            "Login successful! Redirecting...";

        loginMessage.style.color =
            "green";


        /* =========================================
           REDIRECT BASED ON ROLE
        ========================================= */

        setTimeout(function () {

            /* =====================================
               ADMIN
            ===================================== */

            if (role === "admin") {

                window.location.href =
                    "/admin-dashboard.html";

                return;
            }


            /* =====================================
               TEACHER COORDINATOR
            ===================================== */

            if (
                role ===
                "teacher_coordinator"
            ) {

                window.location.href =
                    "/teacher-coordinator-dashboard.html";

                return;
            }


            /* =====================================
               NORMAL MEMBER
            ===================================== */

            window.location.href =
                "/member-dashboard.html";

        }, 500);


    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        loginMessage.textContent =
            "Unable to connect to the server. Please try again.";

        loginMessage.style.color =
            "red";

    }

});
