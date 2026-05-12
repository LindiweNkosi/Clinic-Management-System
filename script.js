// BOOKING FORM FUNCTIONALITY

document.getElementById("bookingForm").addEventListener("submit", function(event) {

    // Prevent page refresh
    event.preventDefault();

    // GET VALUES
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let service = document.getElementById("service").value;
    let date = document.getElementById("date").value;

    // VALIDATION
    if (name === "" || email === "" || service === "" || date === "") {

        document.getElementById("confirmationMessage").innerHTML =
            "Please complete all required fields.";

        return;
    }

    // SUCCESS MESSAGE
    document.getElementById("confirmationMessage").innerHTML =
        "Appointment booked successfully for " + name + "!";

});