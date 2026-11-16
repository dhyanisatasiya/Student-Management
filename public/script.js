
const STORAGE_KEY = "greenwood_students";

let students = [];
let useBackend = false;
let selectedStudentId = null;

const $ = (id) => document.getElementById(id);

// Load data from Express API or browser storage
async function loadStudents() {
    try {
        const response = await fetch("/api/students");

        if (!response.ok) {
            throw new Error("Backend not available");
        }

        students = await response.json();
        useBackend = true;
    } catch (error) {
        useBackend = false;

        try {
            students = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            students = [];
        }
    }

    renderAll();
}

function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

async function saveStudentData(student) {
    if (useBackend) {
        try {
            const response = student.id
                ? await fetch(`/api/students/${student.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(student)
                })
                : await fetch("/api/students", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(student)
                });

            if (!response.ok) throw new Error("Save failed");

            await loadStudents();
            return;
        } catch {
            useBackend = false;
        }
    }

    if (student.id) {
        students = students.map(item =>
            String(item.id) === String(student.id) ? student : item
        );
    } else {
        student.id = Date.now().toString();
        students.push(student);
    }

    saveLocal();
    renderAll();
}

async function deleteStudentData(id) {
    if (!confirm("Are you sure you want to delete this student?")) return;

    if (useBackend) {
        try {
            const response = await fetch(`/api/students/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) throw new Error("Delete failed");

            await loadStudents();
            showPage("students");
            return;
        } catch {
            useBackend = false;
        }
    }

    students = students.filter(item => String(item.id) !== String(id));
    saveLocal();
    renderAll();
    showPage("students");
}

function renderAll() {
    updateDashboard();
    renderRecentStudents();
    renderStudents();
}

function updateDashboard() {
    $("totalStudents").textContent = students.length;

    // All records are treated as active in this simple project.
    $("activeStudents").textContent = students.length;

    const classes = new Set(students.map(student => student.studentClass));
    $("totalClasses").textContent = classes.size;
}

function studentRow(student, showActions = false) {
    const name = escapeHTML(student.name);
    const firstLetter = name.charAt(0).toUpperCase();

    return `
        <tr>
            <td>
                <span class="avatar">${firstLetter}</span>
                <span class="student-name" data-view="${student.id}">${name}</span>
            </td>
            <td>${escapeHTML(student.rollNo)}</td>
            <td>${escapeHTML(student.studentClass)}</td>
            ${showActions ? `
                <td>${escapeHTML(student.phone)}</td>
                <td>${escapeHTML(student.email)}</td>
                <td>
                    <button class="action-btn edit-btn" data-edit="${student.id}" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete-btn" data-delete="${student.id}" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            ` : `
                <td>${escapeHTML(student.email)}</td>
                <td><span class="badge text-bg-success">Active</span></td>
            `}
        </tr>
    `;
}

function renderRecentStudents() {
    const recent = [...students].slice(-5).reverse();

    $("recentTable").innerHTML = recent.length
        ? recent.map(student => studentRow(student)).join("")
        : `<tr><td colspan="5" class="text-center text-muted py-4">No student records yet. Add your first student.</td></tr>`;
}

function renderStudents() {
    const search = $("searchInput").value.toLowerCase().trim();
    const selectedClass = $("classFilter").value;

    const filtered = students.filter(student => {
        const matchesSearch =
            String(student.name || "").toLowerCase().includes(search) ||
            String(student.rollNo || "").toLowerCase().includes(search) ||
            String(student.email || "").toLowerCase().includes(search);

        const matchesClass =
            !selectedClass || student.studentClass === selectedClass;

        return matchesSearch && matchesClass;
    });

    $("studentsTable").innerHTML = filtered
        .map(student => studentRow(student, true))
        .join("");

    $("emptyMessage").classList.toggle("hidden", filtered.length > 0);
}

function showPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.add("hidden");
    });

    const pageElement = $(page + "Page");
    if (pageElement) pageElement.classList.remove("hidden");

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    const titles = {
        dashboard: "Dashboard",
        students: "Students",
        add: "Add Student",
        details: "Student Details"
    };

    $("pageTitle").textContent = titles[page] || "Dashboard";

    if (page === "students") renderStudents();
    if (page === "dashboard") renderAll();
}

function openAddForm() {
    $("studentForm").reset();
    $("studentId").value = "";
    $("formTitle").textContent = "Add New Student";
    showPage("add");
}

function editStudent(id) {
    const student = students.find(item => String(item.id) === String(id));
    if (!student) return;

    $("studentId").value = student.id;
    $("studentName").value = student.name || "";
    $("rollNo").value = student.rollNo || "";
    $("studentClass").value = student.studentClass || "";
    $("studentPhone").value = student.phone || "";
    $("studentEmail").value = student.email || "";
    $("studentGender").value = student.gender || "";
    $("studentAddress").value = student.address || "";

    $("formTitle").textContent = "Edit Student";
    showPage("add");
}

function viewStudent(id) {
    const student = students.find(item => String(item.id) === String(id));
    if (!student) return;

    selectedStudentId = student.id;

    $("detailAvatar").textContent = (student.name || "S").charAt(0).toUpperCase();
    $("detailName").textContent = student.name;
    $("detailRoll").textContent = "Roll Number: " + student.rollNo;

    const details = [
        ["Full Name", student.name],
        ["Roll Number", student.rollNo],
        ["Class", student.studentClass],
        ["Phone Number", student.phone],
        ["Email Address", student.email],
        ["Gender", student.gender || "Not provided"],
        ["Address", student.address || "Not provided"]
    ];

    $("studentDetails").innerHTML = details.map(([label, value]) => `
        <div class="detail-item">
            <small>${label}</small>
            <strong>${escapeHTML(value)}</strong>
        </div>
    `).join("");

    showPage("details");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Navigation
document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
        if (button.dataset.page === "add") {
            openAddForm();
        } else {
            showPage(button.dataset.page);
        }
    });
});

$("topAddBtn").addEventListener("click", openAddForm);
$("addStudentBtn").addEventListener("click", openAddForm);
$("viewAllBtn").addEventListener("click", () => showPage("students"));
$("cancelBtn").addEventListener("click", () => showPage("students"));
$("backBtn").addEventListener("click", () => showPage("students"));

$("searchInput").addEventListener("input", renderStudents);
$("classFilter").addEventListener("change", renderStudents);

// Add and update student
$("studentForm").addEventListener("submit", async event => {
    event.preventDefault();

    const id = $("studentId").value;

    const student = {
        id: id || undefined,
        name: $("studentName").value.trim(),
        rollNo: $("rollNo").value.trim(),
        studentClass: $("studentClass").value,
        phone: $("studentPhone").value.trim(),
        email: $("studentEmail").value.trim(),
        gender: $("studentGender").value,
        address: $("studentAddress").value.trim()
    };

    const duplicateRoll = students.some(item =>
        item.rollNo.toLowerCase() === student.rollNo.toLowerCase() &&
        String(item.id) !== String(id)
    );

    if (duplicateRoll) {
        alert("This roll number already exists!");
        return;
    }

    await saveStudentData(student);
    alert(id ? "Student updated successfully!" : "Student added successfully!");

    $("studentForm").reset();
    showPage("students");
});

// Table buttons and student name clicks
document.addEventListener("click", event => {
    const viewButton = event.target.closest("[data-view]");
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");

    if (viewButton) viewStudent(viewButton.dataset.view);
    if (editButton) editStudent(editButton.dataset.edit);
    if (deleteButton) deleteStudentData(deleteButton.dataset.delete);
});

$("detailEditBtn").addEventListener("click", () => {
    editStudent(selectedStudentId);
});

$("detailDeleteBtn").addEventListener("click", () => {
    deleteStudentData(selectedStudentId);
});

// Start application
loadStudents();
