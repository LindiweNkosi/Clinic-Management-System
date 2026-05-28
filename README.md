# ClinicEase

ClinicEase is a responsive front-end clinic management demo for appointment booking, role-based navigation, analytics, documentation access, and PDF reporting.

> This project is a front-end academic/demo system. Login, roles, and bookings are stored in browser `localStorage`, so they are not production-secure.

## Preview

![ClinicEase dashboard](images/Dashboard.png)

## Demo Credentials

| Role | Username | Password | Access |
| --- | --- | --- | --- |
| Admin | `admin` | `Admin@ClinicEase2026!` | Booking, analytics, reports, and demo data reset |
| Staff | `staff` | `Staff@ClinicEase2026!` | Booking management |
| Viewer | `viewer` | `Viewer@ClinicEase2026!` | Basic read-only navigation |

## Features

- Role-based login and navigation
- Appointment booking with edit, complete, cancel, and search actions
- Appointment status badges for upcoming, today, completed, missed, and cancelled visits
- Analytics dashboard with booking trends and service distribution charts
- Date and service filters for analytics
- PDF report export with jsPDF
- Project documentation and SQL reference links
- Responsive mobile navigation
- Admin-only demo booking reset

## Technologies

- HTML5
- CSS3
- JavaScript
- Chart.js
- jsPDF
- Browser `localStorage`

## Project Structure

```text
.
|-- index.html
|-- booking.html
|-- analytics.html
|-- about.html
|-- documentation.html
|-- login.html
|-- script.js
|-- style.css
|-- docs/
|-- images/
`-- sql/
```

## Run Locally

Open `index.html` in a browser, then log in with one of the demo accounts above.

No build step or package installation is required.

## Deploy With GitHub Pages

1. Push the project to a GitHub repository.
2. Go to the repository's **Settings** tab.
3. Open **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the root folder.
6. Save, then open the published GitHub Pages URL after deployment completes.

## Notes

- Data is saved only in the current browser through `localStorage`.
- Clearing browser storage will remove saved bookings.
- This project is intended for demonstration and portfolio use, not real patient data.

## Future Improvements

- Backend API integration
- Secure authentication and password handling
- Database storage
- Appointment reminder notifications
- More detailed report templates
