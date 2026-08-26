/* =========================================
   FRENCH CLUB
   MEMBER / ADMIN LOGIN
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
                data.message ||
                "Login failed.";

            loginMessage.style.color =
                "red";

            return;
        }


        /* =====================================
           SAVE MEMBER INFORMATION
           ===================================== */

        localStorage.setItem(
            "frenchClubMember",
            JSON.stringify(data.member)
        );


        /* =====================================
           SAVE ROLE
           ===================================== */

        const role =
            String(
                data.role ||
                data.member?.role ||
                "member"
            ).toLowerCase();


        localStorage.setItem(
            "frenchClubRole",
            role
        );


        loginMessage.textContent =
            "Login successful! Redirecting...";

        loginMessage.style.color =
            "green";


        /* =====================================
           ROLE-BASED REDIRECT
           ===================================== */

        setTimeout(function () {

            if (role === "admin") {

                window.location.href =
                    "/admin-dashboard.html";

            }
            else {

                window.location.href =
                    "/member-dashboard.html";

            }

        }, 300);


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