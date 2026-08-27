"use strict";

console.log("Admin profile page loaded.");

const memberData =
    JSON.parse(
        localStorage.getItem("frenchClubMember") || "null"
    );
const profileMessage =
    document.getElementById("profileMessage");

const profilePicture =
    document.getElementById("profilePicture");

const profilePictureInput =
    document.getElementById("profilePictureInput");

const saveProfile =
    document.getElementById("saveProfile");

const changePassword =
    document.getElementById("changePassword");

const backToDashboard =
    document.getElementById("backToDashboard");


/* =====================================================
   CHECK LOGIN
   ===================================================== */

if (!memberData) {

    alert("Please log in first.");

    window.location.href = "login.html";

}
else if (memberData.role !== "admin") {

    alert("Administrator access required.");

    window.location.href = "member-dashboard.html";

}


/* =====================================================
   DISPLAY ADMIN INFORMATION
   ===================================================== */

if (memberData) {

    document.getElementById("name").value =
        memberData.name || "";

    document.getElementById("grNumber").value =
        memberData.gr_number || "";

    document.getElementById("className").value =
        memberData.class_name || "";

    document.getElementById("phone").value =
        memberData.phone || "";

    document.getElementById("email").value =
        memberData.email || "";

    document.getElementById("dateJoined").value =
        memberData.date_joined || "";

    document.getElementById("role").value =
        memberData.role || "";


    /* Existing profile picture */

    if (memberData.profile_picture) {

        profilePicture.src =
            memberData.profile_picture;

    }

}


/* =====================================================
   PROFILE PICTURE PREVIEW
   ===================================================== */

profilePictureInput.addEventListener(
    "change",
    function () {

        const file =
            profilePictureInput.files[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {

            profileMessage.textContent =
                "Please select a JPG, PNG, or WebP image.";

            profilePictureInput.value = "";

            return;

        }

        if (file.size > 5 * 1024 * 1024) {

            profileMessage.textContent =
                "Image is too large. Please choose an image smaller than 5MB.";

            profilePictureInput.value = "";

            return;

        }


        const reader =
            new FileReader();

        reader.onload =
            function () {

                profilePicture.src =
                    reader.result;

            };

        reader.readAsDataURL(file);

    }
);


/* =====================================================
   SAVE PROFILE
   ===================================================== */

saveProfile.addEventListener(
    "click",
    async function () {

        if (!memberData || !memberData.id) {

            profileMessage.textContent =
                "Unable to identify your admin account.";

            return;

        }


        const phone =
            document.getElementById("phone").value.trim();

        const email =
            document.getElementById("email").value.trim();


        if (!phone) {

            profileMessage.textContent =
                "Please enter your phone number.";

            return;

        }


        saveProfile.disabled = true;

        profileMessage.textContent =
            "Saving profile...";


        try {

            /* -----------------------------------------
               UPDATE PHONE
               ----------------------------------------- */

            const phoneResponse =
                await fetch(
                    "/api/admin/members/" +
                    encodeURIComponent(
                        memberData.gr_number
                    ) +
                    "/phone",
                    {

                        method: "PUT",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "x-admin-gr":
                                memberData.gr_number

                        },

                        body:
                            JSON.stringify({
                                phone: phone
                            })

                    }
                );


            const phoneResult =
                await phoneResponse.json();


            if (!phoneResponse.ok) {

                throw new Error(
                    phoneResult.message ||
                    "Unable to update phone number."
                );

            }


            /* -----------------------------------------
               PROFILE PICTURE
               ----------------------------------------- */

            const selectedFile =
                profilePictureInput.files[0];


            if (selectedFile) {

                const reader =
                    new FileReader();


                const imageData =
                    await new Promise(
                        function (resolve, reject) {

                            reader.onload =
                                function () {

                                    resolve(
                                        reader.result
                                    );

                                };

                            reader.onerror =
                                function () {

                                    reject(
                                        new Error(
                                            "Unable to read the image."
                                        )
                                    );

                                };

                            reader.readAsDataURL(
                                selectedFile
                            );

                        }
                    );


                const pictureResponse =
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
                                        memberData.id,

                                    image:
                                        imageData

                                })

                        }
                    );


                const pictureResult =
                    await pictureResponse.json();


                if (!pictureResponse.ok) {

                    throw new Error(
                        pictureResult.message ||
                        "Unable to save profile picture."
                    );

                }


                memberData.profile_picture =
                    pictureResult.profilePicture;

            }


            /* -----------------------------------------
               UPDATE LOCAL STORAGE
               ----------------------------------------- */

            memberData.phone =
                phone;

            memberData.email =
                email;

            localStorage.setItem(
    "frenchClubMember",
    JSON.stringify(memberData)
);

            profileMessage.textContent =
                "Profile updated successfully.";

        }

        catch (error) {

            console.error(
                "Profile update error:",
                error
            );

            profileMessage.textContent =
                error.message ||
                "Unable to update profile.";

        }

        finally {

            saveProfile.disabled = false;

        }

    }
);


/* =====================================================
   CHANGE PASSWORD
   ===================================================== */

changePassword.addEventListener(
    "click",
    function () {

        window.location.href =
            "member-dashboard.html#change-password";

    }
);


/* =====================================================
   BACK TO DASHBOARD
   ===================================================== */

backToDashboard.addEventListener(
    "click",
    function () {

        window.location.href =
            "admin-dashboard.html";

    }
);