
/* =====================================================
   FRENCH CLUB
   MEMBER DASHBOARD
   ===================================================== */


/* =====================================================
   LOAD MEMBER DASHBOARD
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const savedMember =
        localStorage.getItem("frenchClubMember");

    const memberData =
        savedMember
            ? JSON.parse(savedMember)
            : null;


    /* =================================================
       LOGIN CHECK
       ================================================= */

    if (!memberData) {

        alert("Please login first.");

        window.location.href =
            "login.html";

        return;
    }


    /* =================================================
       SECURITY CHECK
       ================================================= */

    if (
        memberData.role &&
        memberData.role !== "member"
    ) {

        window.location.href =
            "admin-dashboard.html";

        return;
    }


    /* =================================================
       MEMBER INFORMATION
       ================================================= */

    const memberName =
        document.getElementById("memberName");

    const myName =
        document.getElementById("myName");

    const myGR =
        document.getElementById("myGR");

    const myClass =
        document.getElementById("myClass");

    const myStatus =
        document.getElementById("myStatus");

    const myPhone =
        document.getElementById("myPhone");

    const myEmail =
        document.getElementById("myEmail");

    const myDateJoined =
        document.getElementById("myDateJoined");


    if (memberName) {
        memberName.textContent =
            memberData.name || "Member";
    }


    if (myName) {
        myName.textContent =
            memberData.name || "-";
    }


    if (myGR) {
        myGR.textContent =
            memberData.gr_number || "-";
    }


    if (myClass) {
        myClass.textContent =
            memberData.class_name || "-";
    }


    if (myStatus) {
        myStatus.textContent =
            memberData.status || "Active";
    }


    if (myPhone) {
        myPhone.textContent =
            memberData.phone || "-";
    }


    if (myEmail) {
        myEmail.textContent =
            memberData.email || "-";
    }


    if (myDateJoined) {

        myDateJoined.textContent =
            memberData.date_joined
                ? new Date(
                    memberData.date_joined
                  ).toLocaleDateString()
                : "-";
    }


    /* =================================================
       PROFILE PICTURE
       ================================================= */

    loadProfilePicture();


    const profileInput =
        document.getElementById("profilePictureInput");

    const profileImage =
        document.getElementById("profileImage");

    const profileMessage =
        document.getElementById("profileMessage");


    if (profileInput) {

        profileInput.addEventListener(
            "change",
            function () {

                const file =
                    profileInput.files[0];

                if (!file) {
                    return;
                }


                if (!file.type.startsWith("image/")) {

                    if (profileMessage) {
                        profileMessage.textContent =
                            "Please select an image file.";
                    }

                    return;
                }


                if (file.size > 5 * 1024 * 1024) {

                    if (profileMessage) {
                        profileMessage.textContent =
                            "Image must be smaller than 5MB.";
                    }

                    return;
                }


                const reader =
                    new FileReader();


                reader.onload = function (event) {

                    const imageData =
                        event.target.result;


                    localStorage.setItem(
                        "frenchClubProfilePicture_" +
                        memberData.id,
                        imageData
                    );


                    if (profileImage) {

                        profileImage.src =
                            imageData;

                    }


                    if (profileMessage) {

                        profileMessage.textContent =
                            "Profile picture updated.";

                    }

                };


                reader.readAsDataURL(file);

            }
        );

    }


    /* =================================================
       CHANGE PASSWORD
       ================================================= */

    setupChangePassword(memberData);


    /* =================================================
       LOAD ATTENDANCE
       ================================================= */

    loadMyAttendance(memberData.id);


    /* =================================================
       LOAD PAYMENTS
       ================================================= */

    loadMyPayments(memberData.id);


    /* =================================================
       LOGOUT
       ================================================= */

    const logoutButton =
        document.getElementById("memberLogout");


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
   LOAD PROFILE PICTURE
   ===================================================== */

function loadProfilePicture() {

    const savedMember =
        localStorage.getItem("frenchClubMember");

    if (!savedMember) {
        return;
    }


    const memberData =
        JSON.parse(savedMember);


    const profileImage =
        document.getElementById("profileImage");


    if (!profileImage) {
        return;
    }


    const savedPicture =
        localStorage.getItem(
            "frenchClubProfilePicture_" +
            memberData.id
        );


    if (savedPicture) {

        profileImage.src =
            savedPicture;

    }

}


/* =====================================================
   CHANGE PASSWORD
   ===================================================== */

function setupChangePassword(memberData) {

    const form =
        document.getElementById(
            "changePasswordForm"
        );


    const message =
        document.getElementById(
            "passwordMessage"
        );


    const button =
        document.getElementById(
            "changePasswordButton"
        );


    const cancelButton =
        document.getElementById(
            "cancelPasswordButton"
        );


    const container =
        document.getElementById(
            "changePasswordContainer"
        );


    if (!form) {
        return;
    }


    /* =================================================
       OPEN PASSWORD FORM
       ================================================= */

    const openButton =
        document.getElementById(
            "openPasswordButton"
        );


    if (openButton) {

        openButton.addEventListener(
            "click",
            function () {

                if (container) {

                    container.style.display =
                        "block";

                    container.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }

            }
        );

    }


    /* =================================================
       CANCEL PASSWORD CHANGE
       ================================================= */

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                form.reset();


                if (container) {

                    container.style.display =
                        "none";

                }


                if (message) {

                    message.textContent =
                        "";

                }

            }
        );

    }


    /* =================================================
       SUBMIT PASSWORD CHANGE
       ================================================= */

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const currentPassword =
                document.getElementById(
                    "currentPassword"
                );


            const newPassword =
                document.getElementById(
                    "newPassword"
                );


            const confirmPassword =
                document
```
