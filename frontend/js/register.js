/* =========================================
   FRENCH CLUB
   MEMBER REGISTRATION
   ========================================= */

const registrationForm =
    document.getElementById("registrationForm");

const registrationMessage =
    document.getElementById("registrationMessage");


registrationForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const name =
            document.getElementById("name").value.trim();

        const grNumber =
            document.getElementById("grNumber").value.trim();

        const className =
            document.getElementById("class").value;

        const phone =
            document.getElementById("phone").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        if (password !== confirmPassword) {

            registrationMessage.textContent =
                "Passwords do not match.";

            registrationMessage.style.color = "red";

            return;
        }


        registrationMessage.textContent =
            "Registering...";

        registrationMessage.style.color = "blue";


        try {

            const response = await fetch(
                "/api/auth/register",
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


            if (!response.ok) {

                registrationMessage.textContent =
                    data.message || "Registration failed.";

                registrationMessage.style.color = "red";

                return;
            }


            registrationMessage.textContent =
                "Registration successful! You can now login.";

            registrationMessage.style.color = "green";


            registrationForm.reset();


            setTimeout(function () {

                window.location.href =
                    "login.html";

            }, 1500);


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            registrationMessage.textContent =
                "Unable to connect to the server.";

            registrationMessage.style.color = "red";
        }

    }
);