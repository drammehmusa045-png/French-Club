/* =========================================
   FRENCH CLUB
   MEMBER REGISTRATION
   ========================================= */

const registrationForm = document.getElementById("registrationForm");
const registrationMessage = document.getElementById("registrationMessage");


registrationForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    /* ================= GET FORM DATA ================= */

    const name = document.getElementById("name").value.trim();
    const grNumber = document.getElementById("grNumber").value.trim();
    const className = document.getElementById("class").value;
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;


    /* ================= VALIDATION ================= */

    if (!name || !grNumber || !className || !phone || !password) {

        registrationMessage.textContent =
            "Please fill in all required fields.";

        registrationMessage.style.color = "red";

        return;
    }


    if (password !== confirmPassword) {

        registrationMessage.textContent =
            "Passwords do not match.";

        registrationMessage.style.color = "red";

        return;
    }


    if (password.length < 6) {

        registrationMessage.textContent =
            "Password must be at least 6 characters.";

        registrationMessage.style.color = "red";

        return;
    }


    /* ================= SEND TO SERVER ================= */

    try {

        registrationMessage.textContent =
            "Registering member...";

        registrationMessage.style.color = "#2563eb";


        const response = await fetch(
            "http://localhost:3000/api/auth/register",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    name: name,

                    grNumber: grNumber,

                    className: className,

                    phone: phone,

                    email: email,

                    password: password

                })

            }
        );


        const data = await response.json();


        /* ================= SERVER RESPONSE ================= */

        if (!response.ok) {

            registrationMessage.textContent =
                data.message || "Registration failed.";

            registrationMessage.style.color = "red";

            return;
        }


        registrationMessage.textContent =
            "Registration successful!";

        registrationMessage.style.color = "green";


        registrationForm.reset();


        /* ================= GO TO LOGIN ================= */

        setTimeout(function () {

            window.location.href = "login.html";

        }, 1500);


    } catch (error) {

        console.error(error);


        registrationMessage.textContent =
            "Unable to connect to the server. Please try again.";

        registrationMessage.style.color = "red";

    }

});