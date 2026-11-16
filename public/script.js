
// ELEMENTS

const form = document.getElementById("studentForm");
const table = document.getElementById("studentTable");

const navLinks = document.querySelectorAll(".sidebar .nav");

const pages = {
    dashboard: document.getElementById("dashboardPage"),
    students: document.getElementById("studentsPage"),
    add: document.getElementById("addPage"),
    details: document.getElementById("detailsPage")
};

let students = [];
let editId = null;
let selectedStudentId = null;


// =====================================
// API REQUEST
// =====================================

async function request(url, options = {}) {

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
    }

    return data;
}


// =====================================
// PAGE NAVIGATION
// =====================================

function openPage(page) {

    Object.values(pages).forEach(item => {
        item.classList.remove("active");
    });

    navLinks.forEach(link => {
        link.classList.remove("active");
    });

    if (pages[page]) {
        pages[page].classList.add("active");
    }

    const activeLink = document.querySelector(
        `.nav[data-page="${page}"]`
    );

    if (activeLink) {
        activeLink.classList.add("active");
    }

    const names = {
        dashboard: "Dashboard",
        students: "Students",
        add: "Add Student",
        details: "Student Details"
    };

    document.getElementById("breadcrumb").innerText =
        names[page] || "Dashboard";

    window.scrollTo(0, 0);
}


// SIDEBAR CLICK

navLinks.forEach(link => {

    link.addEventListener("click", function(e) {

        e.preventDefault();

        const page = this.dataset.page;

        if (page === "add") {
            resetForm();
        }

        if (page !== "add") {
            resetForm();
        }

        openPage(page);

        if (page === "students" || page === "dashboard") {
            loadStudents();
        }

        history.replaceState(null, "", "#" + page);

    });

});


// QUICK ACTIONS

document.querySelectorAll("[data-go]").forEach(button => {

    button.addEventListener("click", function() {

        const page = this.dataset.go;

        resetForm();
        openPage(page);

        if (page === "students" || page === "dashboard") {
            loadStudents();
        }

        history.replaceState(null, "", "#" + page);

    });

});


// =====================================
// LOAD STUDENTS
// =====================================

async function loadStudents() {

    try {

        students = await request("/api/students");

        displayStudents();

        updateDashboard();

    }

    catch (error) {

        console.error(error);

        table.innerHTML = `
            <tr>
                <td colspan="5">Unable to load students.</td>
            </tr>
        `;

    }

}


// =====================================
// DASHBOARD STATISTICS
// =====================================

function updateDashboard() {

    document.getElementById("totalStudents").innerText =
        students.length;

    document.getElementById("totalRecords").innerText =
        students.length;

    const classes = new Set(
        students.map(s => s.className)
    );

    document.getElementById("totalClasses").innerText =
        classes.size;

}


// =====================================
// SAFE TEXT
// =====================================

function safe(value) {

    return String(value ?? "-").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

}


// =====================================
// DISPLAY STUDENTS
// =====================================

function displayStudents() {

    const search = document.getElementById("searchInput")
        .value.toLowerCase();

    const selectedClass = document.getElementById("classFilter")
        .value;

    const filtered = students.filter(s => {

        const matchSearch = [
            s.name,
            s.rollNo,
            s.className,
            s.email,
            s.phone
        ].some(value =>
            String(value).toLowerCase().includes(search)
        );

        const matchClass =
            !selectedClass || s.className === selectedClass;

        return matchSearch && matchClass;

    });


    document.getElementById("recordCount").innerText =
        filtered.length + " Records";

    document.getElementById("showingText").innerText =
        `Showing ${filtered.length} of ${students.length} students`;


    if (filtered.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:30px">
                    <i class="bi bi-people" style="font-size:25px"></i>
                    <p style="margin-top:8px">No Students Found</p>
                </td>
            </tr>
        `;

        return;

    }


    table.innerHTML = filtered.map(s => `

        <tr>

            <td>
                <div class="student-name">

                    <a href="#details"
                       class="student-detail"
                       data-id="${safe(s.id)}">

                       ${safe(s.name)}

                    </a>

                </div>

                <div class="student-email">
                    ${safe(s.email)}
                </div>
            </td>

            <td>${safe(s.rollNo)}</td>

            <td>
                <span class="class-badge">
                    ${safe(s.className)}
                </span>
            </td>

            <td>${safe(s.phone)}</td>

            <td>

                <button class="action-btn edit-btn"
                    data-action="edit"
                    data-id="${safe(s.id)}">

                    <i class="bi bi-pencil"></i> Edit

                </button>

                <button class="action-btn delete-btn"
                    data-action="delete"
                    data-id="${safe(s.id)}">

                    <i class="bi bi-trash"></i> Delete

                </button>

            </td>

        </tr>

    `).join("");

}


// =====================================
// ADD / UPDATE STUDENT
// =====================================

form.addEventListener("submit", async function(e) {

    e.preventDefault();

    const student = {

        name: document.getElementById("name").value.trim(),

        rollNo: document.getElementById("rollNo").value.trim(),

        className: document.getElementById("className").value,

        email: document.getElementById("email").value.trim(),

        phone: document.getElementById("phone").value.trim()

    };


    const submitBtn = document.getElementById("submitBtn");

    submitBtn.disabled = true;

    try {

        if (editId) {

            await request(`/api/students/${editId}`, {
                method: "PUT",
                body: JSON.stringify(student)
            });

            alert("Student Updated Successfully!");

        }

        else {

            await request("/api/students", {
                method: "POST",
                body: JSON.stringify(student)
            });

            alert("Student Added Successfully!");

        }


        resetForm();

        await loadStudents();

        openPage("students");

        history.replaceState(null, "", "#students");

    }

    catch (error) {

        alert(error.message);

    }

    finally {

        submitBtn.disabled = false;

    }

});


// =====================================
// STUDENT TABLE CLICK
// =====================================

table.addEventListener("click", async function(e) {

    // Student Name Click

    const detailLink = e.target.closest(".student-detail");

    if (detailLink) {

        e.preventDefault();

        const id = detailLink.dataset.id;

        showStudentDetails(id);

        return;

    }


    const button = e.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    const student = students.find(s => s.id === id);

    if (!student) return;


    // EDIT STUDENT

    if (button.dataset.action === "edit") {

        editId = id;

        document.getElementById("name").value = student.name;
        document.getElementById("rollNo").value = student.rollNo;
        document.getElementById("className").value = student.className;
        document.getElementById("email").value = student.email;
        document.getElementById("phone").value = student.phone;

        document.getElementById("formPageTitle").innerText =
            "Update Student";

        document.getElementById("submitBtn").innerHTML =
            '<i class="bi bi-check-circle"></i> Save Changes';

        document.getElementById("cancelBtn")
            .classList.remove("hidden");

        openPage("add");

        history.replaceState(null, "", "#add");

    }


    // DELETE STUDENT

    if (button.dataset.action === "delete") {

        const confirmDelete = confirm(
            `Are you sure you want to delete ${student.name}?`
        );

        if (!confirmDelete) return;

        try {

            await request(`/api/students/${id}`, {
                method: "DELETE"
            });

            alert("Student Deleted Successfully!");

            await loadStudents();

        }

        catch (error) {

            alert(error.message);

        }

    }

});


// =====================================
// STUDENT DETAILS PAGE
// =====================================

function showStudentDetails(id) {

    const student = students.find(s => s.id === id);

    if (!student) return;

    selectedStudentId = id;

    document.getElementById("profileAvatar").innerText =
        student.name.charAt(0).toUpperCase();

    document.getElementById("detailName").innerText =
        student.name;

    document.getElementById("detailClass").innerText =
        student.className;

    document.getElementById("detailRoll").innerText =
        student.rollNo;

    document.getElementById("detailClassFull").innerText =
        student.className;

    document.getElementById("detailEmail").innerText =
        student.email;

    document.getElementById("detailPhone").innerText =
        student.phone;

    openPage("details");

    history.replaceState(null, "", "#details");

}


// BACK TO STUDENTS

document.getElementById("backStudents")
    .addEventListener("click", function() {

        openPage("students");

        loadStudents();

        history.replaceState(null, "", "#students");

    });


// EDIT FROM DETAILS PAGE

document.getElementById("detailEdit")
    .addEventListener("click", function() {

        const student = students.find(
            s => s.id === selectedStudentId
        );

        if (!student) return;

        editId = student.id;

        document.getElementById("name").value = student.name;
        document.getElementById("rollNo").value = student.rollNo;
        document.getElementById("className").value = student.className;
        document.getElementById("email").value = student.email;
        document.getElementById("phone").value = student.phone;

        document.getElementById("formPageTitle").innerText =
            "Update Student";

        document.getElementById("submitBtn").innerHTML =
            '<i class="bi bi-check-circle"></i> Save Changes';

        document.getElementById("cancelBtn")
            .classList.remove("hidden");

        openPage("add");

        history.replaceState(null, "", "#add");

    });


// =====================================
// RESET FORM
// =====================================

function resetForm() {

    form.reset();

    editId = null;

    document.getElementById("formPageTitle").innerText =
        "Add New Student";

    document.getElementById("submitBtn").innerHTML =
        '<i class="bi bi-plus-circle"></i> Add Student';

    document.getElementById("cancelBtn")
        .classList.add("hidden");

}


// CANCEL BUTTON

document.getElementById("cancelBtn")
    .addEventListener("click", function() {

        resetForm();

        openPage("students");

        loadStudents();

        history.replaceState(null, "", "#students");

    });


// =====================================
// SEARCH
// =====================================

document.getElementById("searchInput")
    .addEventListener("input", displayStudents);


// CLASS FILTER

document.getElementById("classFilter")
    .addEventListener("change", displayStudents);


// =====================================
// INITIALIZE WEBSITE
// =====================================

const initialPage = location.hash.replace("#", "");

const validPages = [
    "dashboard",
    "students",
    "add",
    "details"
];

openPage(
    validPages.includes(initialPage)
        ? initialPage
        : "dashboard"
);

loadStudents();
