function requireAuth() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    
    // Fixed for local folder setups (file:///)
    const currentPath = window.location.pathname.toLowerCase();
    const isHomePage = currentPath.includes("index.html") || currentPath.endsWith("/");

    const loginContainer = document.getElementById("homepageLoginContainer");
    const mainContent = document.getElementById("mainContent");

    if (!isLoggedIn) {
        if (isHomePage) {
            // Show login screen, hide main app dashboard
            if (loginContainer) loginContainer.style.setProperty("display", "flex", "important");
            if (mainContent) mainContent.style.setProperty("display", "none", "important");
        } else {
            // If they are on booking.html or analytics.html while logged out, redirect them back home
            window.location.href = "index.html";
        }
    } else {
        // If logged in and on home page, hide login and show main website content
        if (isHomePage) {
            if (loginContainer) loginContainer.style.setProperty("display", "none", "important");
            if (mainContent) mainContent.style.setProperty("display", "block", "important");
        }
    }
}

let editIndex = -1;
let latestReport = null;
let reportInterval = null;

const demoUsers = {
    admin: {
        password: "Admin@ClinicEase2026!",
        role: "admin"
    },
    staff: {
        password: "Staff@ClinicEase2026!",
        role: "staff"
    },
    viewer: {
        password: "Viewer@ClinicEase2026!",
        role: "viewer"
    }
};

// LOAD BOOKINGS WHEN PAGE OPENS

window.onload = function () {

    // ADD This single line at the very start of your original window.onload function:
    requireAuth();

    setUserWelcome();
    applyRoleNavigation();
    //BOOKING PAGE
    if (document.getElementById("bookingList")) {
        displayBookings();
    }

    //ANALYTICS PAGE
    if (document.getElementById("bookingChart") &&
        document.getElementById("serviceChart") &&
        this.document.getElementById("analyticsTotalBookings")
    
    ) {
        loadAnalytics();
    }

    //SEARCH
    setupSearch();
};


// BOOKING FORM FUNCTIONALITY
if (document.getElementById("bookingForm")) {

    document.getElementById("bookingForm").addEventListener("submit", function(event) {
        event.preventDefault();

        // 1. GET VALUES SAFELY
        let nameEl = document.getElementById("name");
        let emailEl = document.getElementById("email");
        let serviceEl = document.getElementById("service");
        let dateEl = document.getElementById("date");
        let notesEl = document.getElementById("notes");
        let phoneEl = document.getElementById("phone"); // Optional field, may not exist

        // Make sure fields actually exist before grabbing values
        let name = nameEl ? nameEl.value : "";
        let email = emailEl ? emailEl.value : "";
        let service = serviceEl ? serviceEl.value : "";
        let date = dateEl ? dateEl.value : "";
        let notes = notesEl ? notesEl.value : "";
        let phone = phoneEl ? phoneEl.value : "";

        // 2. VALIDATION
        if (name === "" || email === "" || service === "" || date === "") {
            let confMsg = document.getElementById("confirmationMessage");
            if (confMsg) {
                confMsg.style.color = "red";
                confMsg.innerHTML = "Please complete all required fields.";
            }
            return;
        }

        // 3. CREATE BOOKING OBJECT
        let booking = {
            name: name,
            email: email,
            service: service,
            date: date,
            status:"Upcoming",
            notes: notes,
            phone: phone
        };

        // 4. GET EXISTING BOOKINGS
        let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

        // 5. CHECK EDIT MODE
        if (editIndex === -1) {
            bookings.push(booking);
        } else {
            bookings[editIndex] = booking;
            editIndex = -1; // Reset edit mode
        }

        // 6. SAVE TO LOCAL STORAGE
        localStorage.setItem("bookings", JSON.stringify(bookings));

        // 7. REFRESH BOOKING LIST VISUALLY (if the display list element is on this page)
        if (document.getElementById("bookingList")) {
            displayBookings();
        }

        // 8. CALCULATE REVENUE SAFELY (Does not crash if totalRevenue is missing)
        let prices = {
            "General Consultation": 500,
            "Dental Care": 800,
            "Eye Examination": 350,
            "Training Session": 250
        };

        let totalRevenue = 0;
        bookings.forEach(function(b) {
            totalRevenue += prices[b.service] || 0;
        });

        let revenueEl = document.getElementById("totalRevenue");
        if (revenueEl) {
            revenueEl.innerHTML = "R" + totalRevenue;
        }

        // 9. REFRESH CHARTS SAFELY
        if (document.getElementById("bookingChart") && document.getElementById("serviceChart")) {
            if (typeof loadAnalytics === "function") {
                loadAnalytics();
            }
        }

// 10. SUCCESS INTERFACE UPDATES (Triggers custom centered popup)
        let customModal = document.getElementById("customAlertModal");
        if (customModal) {
            customModal.style.display = "flex"; // Reveals our flexbox centered container
        }

        // Set the optional subtle on-screen success text underneath the form
        let confMsg = document.getElementById("confirmationMessage");
        if (confMsg) {
            confMsg.style.color = "green";
            confMsg.innerHTML = "Appointment booked successfully!";
        }

        // 11. RESET FORM WIPE
        document.getElementById("bookingForm").reset();
    });
}

// DISPLAY BOOKINGS
function displayBookings() {

    let bookingList = document.getElementById("bookingList");
   
    //PREVENT ERRORS ON OTHER PAGES
    if (!bookingList) return;

    let bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    // CLEAR DISPLAY
    bookingList.innerHTML = "";

    // EMPTY STATE
    if (bookings.length === 0) {

        bookingList.innerHTML = "<p>No bookings yet.</p>";

        return;
    }

    // TOTAL BOOKINGS
    if (document.getElementById("totalBookings")) {

        document.getElementById("totalBookings").innerHTML =
            bookings.length;
    }

    // SERVICE COUNTS
    let serviceCounts = {};

    bookings.forEach(function(booking) {

        if (serviceCounts[booking.service]) {

            serviceCounts[booking.service]++;

        } else {

            serviceCounts[booking.service] = 1;
        }
    });

    // MOST POPULAR SERVICE
    let mostPopular = "None";

    let highestCount = 0;

    for (let service in serviceCounts) {

        if (serviceCounts[service] > highestCount) {

            highestCount = serviceCounts[service];

            mostPopular = service;
        }
    }

    // DISPLAY MOST POPULAR SERVICE
    if (document.getElementById("popularService")) {

        document.getElementById("popularService").innerHTML =
            mostPopular;
    }

    // UPCOMING BOOKINGS
    if (document.getElementById("upcomingBookings")) {

        document.getElementById("upcomingBookings").innerHTML =
            bookings.length;
    }

    // DISPLAY BOOKINGS
    bookings.forEach(function(booking, index) {

       // STATUS LOGIC

let today = new Date().toISOString().split("T")[0];

// USE STORED STATUS FIRST
let status = booking.status;

// AUTO STATUS LOGIC
if (status !== "Cancelled" &&
    status !== "Completed" 
) {

    if (booking.date > today) {

        status = "Upcoming";

    } else if (booking.date < today) {

        status = "Missed";

    } else {

        status = "Today";
    }
}

let bookingHTML = `

    <tr>

        <td>${booking.name}</td>

        <td>${booking.email}</td>

        <td>${booking.phone}</td>

        <td>${booking.service}</td>

        <td>${booking.date}</td>

        <td>${booking.notes}</td>

        <td>

    <span class="status ${status.toLowerCase()}">

        ${status}

    </span>

</td>

        <td>

            <button onclick="editBooking(${index})">
                Edit
            </button>

            <button onclick="completeBooking(${index})">
                Complete
            </button>

            <button onclick="cancelBooking(${index})">
                Cancel
            </button>

        </td>

    </tr>
`;

        bookingList.innerHTML += bookingHTML;
    });
}

// SEARCH FUNCTION
function setupSearch() {

    let searchInput =
        document.getElementById("searchInput");

    // STOP IF INPUT DOESN'T EXIST
    if (!searchInput) {

        console.log("Search input not found");

        return;
    }

    searchInput.addEventListener("keyup", function() {

        let searchValue =
            searchInput.value.toLowerCase();

        // GET TABLE ROWS
        let rows =
            document.querySelectorAll("#bookingList tr");

        rows.forEach(function(row) {

            let text =
                row.textContent.toLowerCase();

            // MATCH SEARCH
            if (text.includes(searchValue)) {

                row.style.display = "";

            } else {

                row.style.display = "none";
            }
        });
    });
}
if (document.getElementById("loginForm")) {

    document.getElementById("loginForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        let username =
            document.getElementById("username").value;

        let password =
            document.getElementById("password").value;

        let demoUser = demoUsers[username];

        if (demoUser && password === demoUser.password) {

            localStorage.setItem("isLoggedIn", "true");

            localStorage.setItem("userRole", demoUser.role);

            window.location.href = "index.html";

        }

        else {

            alert("Invalid login credentials.");
        }
    });
}

// CANCEL BOOKING
function cancelBooking(index) {

    let bookings =
        JSON.parse(localStorage.getItem("bookings"))
        || [];

    if (!bookings[index]) return;

    // The browser confirmation popup text changed here
    let confirmCancel = confirm("Are you sure you want to cancel this appointment?");

    if (!confirmCancel) return;

    // Keep the record so analytics can count cancelled appointments.
    bookings[index].status = "Cancelled";

    // SAVE
    localStorage.setItem(
        "bookings",
        JSON.stringify(bookings)
    );

    // REFRESH
    displayBookings();
}

// EDIT BOOKING
function editBooking(index) {

    let bookings =
        JSON.parse(localStorage.getItem("bookings")) || [];

    let booking = bookings[index];

    // LOAD VALUES INTO FORM
    document.getElementById("name").value =
        booking.name;

    document.getElementById("email").value =
        booking.email;

    document.getElementById("service").value =
        booking.service;

    document.getElementById("date").value =
        booking.date;

    document.getElementById("notes").value =
        booking.notes || "";

    document.getElementById("phone").value =
        booking.phone || "";

    // STORE INDEX
    editIndex = index;
      document.getElementById("bookingForm").scrollIntoView({
        behavior: "smooth"
      });
}


function applyFilter() {

    let from = document.getElementById("fromDate").value;
    let to = document.getElementById("toDate").value;
    let selectedService = document.getElementById("serviceFilter").value;

    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    let filtered = bookings.filter(b => {

        let date = new Date(b.date);

        // DATE FILTER
        if (from && date < new Date(from)) return false;
        if (to && date > new Date(to)) return false;

        // SERVICE FILTER
        if (selectedService && b.service !== selectedService) return false;

        return true;
    });

    loadAnalytics(filtered);
}

function clearFilter() {

    // Reset inputs
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";
    document.getElementById("serviceFilter").value = "";
    // Reload full dataset
    loadAnalytics();
}

function exportPDF() {

    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 10;

    // TITLE
    doc.setFontSize(16);
    doc.text("Clinic Bookings Report", 10, y);
    y += 10;

    // HEADERS
    doc.setFontSize(10);
    doc.text("Name | Email | Phone | Service | Date | Notes", 10, y);
    y += 8;

    // DATA
    bookings.forEach((b, index) => {

        let line = `${b.name} | ${b.email} | ${b.phone} | ${b.service} | ${b.date} | ${b.notes}`;

        doc.text(line, 10, y);
        y += 8;

        // NEW PAGE IF NEEDED
        if (y > 280) {
            doc.addPage();
            y = 10;
        }
    });

    doc.save("clinic_report.pdf");
}

function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    
    // Take them out of the system back to the index page gatekeeper
    window.location.href = "index.html";
}

function setUserWelcome() {
    let role = localStorage.getItem("userRole");

    let welcome = document.getElementById("welcomeUser");

    if (!welcome) return;

    if (role) {
        welcome.innerText = role.toUpperCase();
    } else {
        welcome.innerText = "Guest";
    }
}

function toggleMenu() {
    document.getElementById("navLinks").classList.toggle("active");
}

function getUserRole() {
    return localStorage.getItem("userRole");
}

function applyRoleNavigation() {

    let role = getUserRole();

    let analyticsLink = document.querySelector('a[href="analytics.html"]');
    let bookingLink = document.querySelector('a[href="booking.html"]');
    if (role === "viewer") {

        if (analyticsLink) analyticsLink.style.display = "none";
        if (bookingLink) bookingLink.style.display = "none";
    }

    if (role === "staff") {
        if (analyticsLink) analyticsLink.style.display = "none";
    }
}

//FUCNTION TO CLOSE THE CUSTOM CENTERED POPUP
function closeCustomAlert() {
    let customModal = document.getElementById("customAlertModal");
    if (customModal) {
        customModal.style.display = "none";
    }
}

// COMPLETE BOOKING
function completeBooking(index) {

    let bookings =
        JSON.parse(localStorage.getItem("bookings"))
        || [];

    // UPDATE STATUS
    bookings[index].status = "Completed";

    // SAVE
    localStorage.setItem(
        "bookings",
        JSON.stringify(bookings)
    );

    // REFRESH
    displayBookings();
}

// UNIFIED ANALYTICS AND CHART GENERATOR
function loadAnalytics(filteredBookings = null) {
    // If a filter is applied, use it. Otherwise, pull all bookings from storage.
    let bookings = filteredBookings || JSON.parse(localStorage.getItem("bookings")) || [];

    // TOTAL BOOKINGS COUNT
    let totalEl = document.getElementById("analyticsTotalBookings");
    if (totalEl) totalEl.innerHTML = bookings.length;

    // COUNTERS
    let upcoming = 0;
    let completed = 0;
    let missed = 0;
    let cancelled = 0;

    // SERVICE COUNTS FOR THE PIE CHART
    let serviceCounts = {};
    let today = new Date().toISOString().split("T")[0];

    // LOOP THROUGH DATA SET
    bookings.forEach(function(booking) {
        let status = booking.status;

        // AUTO STATUS LOGIC FOR ACTIVE BOOKINGS
        if (status !== "Cancelled" && status !== "Completed") {
            if (booking.date > today) {
                status = "Upcoming";
            } else if (booking.date < today) {
                status = "Missed";
            } else {
                status = "Today";
            }
        }

        // INCREMENT STAT BOX COUNTERS
        if (status === "Upcoming" || status === "Today") {
            upcoming++;
        } else if (status === "Completed") {
            completed++;
        } else if (status === "Missed") {
            missed++;
        } else if (status === "Cancelled") {
            cancelled++;
        }

        // COLLECT SERVICE TYPES
        if (booking.service) {
            serviceCounts[booking.service] = (serviceCounts[booking.service] || 0) + 1;
        }
    });

    // MOST POPULAR SERVICE CALCULATION
    let mostPopular = "None";
    let highest = 0;
    for (let service in serviceCounts) {
        if (serviceCounts[service] > highest) {
            highest = serviceCounts[service];
            mostPopular = service;
        }
    }

    // UPDATE STAT UI BOXES SAFELY
    let popServiceEl = document.getElementById("analyticsPopularService");
    let upcomingEl = document.getElementById("analyticsUpcomingBookings");
    let completedEl = document.getElementById("analyticsCompletedAppointments");
    let missedEl = document.getElementById("analyticsMissedAppointments");
    let cancelledEl = document.getElementById("analyticsCancelledAppointments");

    if (popServiceEl) popServiceEl.innerHTML = mostPopular;
    if (upcomingEl) upcomingEl.innerHTML = upcoming;
    if (completedEl) completedEl.innerHTML = completed;
    if (missedEl) missedEl.innerHTML = missed;
    if (cancelledEl) cancelledEl.innerHTML = cancelled;

    // RENDER GRAPHS
    let chart1El = document.getElementById("bookingChart");
    let chart2El = document.getElementById("serviceChart");

    if (chart1El && chart2El && typeof Chart !== "undefined") {
        let dates = {};
        let services = {};

        bookings.forEach(b => {
            dates[b.date] = (dates[b.date] || 0) + 1;
            services[b.service] = (services[b.service] || 0) + 1;
        });

        if (window.bookingChartInstance) window.bookingChartInstance.destroy();
        if (window.serviceChartInstance) window.serviceChartInstance.destroy();

// 1. CHRONOLOGICAL DATE SORTING
        // Pull out the unique dates, sort them oldest to newest so the timeline flows left-to-right
        let sortedDates = Object.keys(dates).sort(function(a, b) {
            return new Date(a) - new Date(b);
        });

        // Map out the corresponding booking numbers to match our sorted chronological order
        let sortedDataValues = sortedDates.map(dateKey => dates[dateKey]);

        window.bookingChartInstance = new Chart(chart1El, {
            type: "line",
            data: {
                labels: sortedDates, // Chronological sorted date string array
                datasets: [{
                    label: "Appointment Trends",
                    data: sortedDataValues, // Sorted data counts
                    borderColor: "#1f3c88",
                    backgroundColor: "rgba(31, 60, 136, 0.15)",
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: "#3a6cf4",
                    pointRadius: sortedDates.length > 30 ? 0 : 4 // Dynamically hides the interactive point dots if there are too many dates, preventing clutter!
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allows the graph to scale nicely across mobile and desktop
                scales: {
                    x: {
                        grid: {
                            display: false // Turns off background vertical grid lines for a cleaner look
                        },
                        ticks: {
                            autoSkip: true, // THE CRITICAL LAYER: Automatically skips labels to prevent overlap
                            maxTicksLimit: 10, // Restricts the bottom axis to show a maximum of 10 clean date markers at any given time
                            maxRotation: 0, // Forces dates to stay horizontal instead of tilting diagonally
                            minRotation: 0
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        window.serviceChartInstance = new Chart(chart2El, {
            type: "pie",
            data: {
                labels: Object.keys(services),
                datasets: [{
                    label: "Services Distributed",
                    data: Object.values(services),
                    backgroundColor: ["#1f3c88", "#3a6cf4", "#4CAF50", "#FF9800", "#f44336"]
                }]
            }
        });
    }
}

function generatePDFReport() {

    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 10;

    // TITLE
    doc.setFontSize(18);
    doc.text("Clinic Management Report", 10, y);
    y += 10;

    // DATE
    doc.setFontSize(11);
    doc.text("Generated: " + new Date().toLocaleString(), 10, y);
    y += 10;

    // ======================
    // SUMMARY SECTION
    // ======================
    let total = bookings.length;
    let completed = bookings.filter(b => b.status === "Completed").length;
    let cancelled = bookings.filter(b => b.status === "Cancelled").length;
    let missed = bookings.filter(b => b.status === "Missed").length;

    doc.setFontSize(12);
    doc.text(`Total Bookings: ${total}`, 10, y); y += 7;
    doc.text(`Completed: ${completed}`, 10, y); y += 7;
    doc.text(`Cancelled: ${cancelled}`, 10, y); y += 7;
    doc.text(`Missed: ${missed}`, 10, y); y += 10;

    doc.text("----------------------------------------", 10, y);
    y += 10;

    // ======================
    // BOOKINGS TABLE
    // ======================
    doc.setFontSize(10);

    bookings.forEach((b) => {

        let line = `${b.name} | ${b.service} | ${b.date} | ${b.status || "Active"}`;

        doc.text(line, 10, y);
        y += 7;

        if (y > 280) {
            doc.addPage();
            y = 10;
        }
    });

    // SAVE TO MEMORY (not just download)
    latestReport = doc;

    return doc;
}

function refreshSystem() {
    loadAnalytics();
    generatePDFReport();
}

window.addEventListener("load", function () {
    if (window.location.pathname.includes("analytics")) {
        refreshSystem();
    }
});

function startDailyReports() {

    // 24 hours = 86,400,000 ms
    reportInterval = setInterval(() => {
        generatePDFReport();
        console.log("Daily report generated automatically");
    }, 86400000);
}

function stopReports() {
    clearInterval(reportInterval);
}

function downloadLatestReport() {
    if (latestReport) {
        latestReport.save("clinic_report.pdf");
    } else {
        generatePDFReport().save("clinic_report.pdf");
    }
}

function downloadLatestReport() {
    if (latestReport) {
        latestReport.save("clinic_report.pdf");
    } else {
        generatePDFReport().save("clinic_report.pdf");
    }
}
