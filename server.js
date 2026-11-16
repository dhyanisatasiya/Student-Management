
const express = require("express");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
const PORT = 3000;

const file = path.join(__dirname, "students.json");

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Read JSON Data
function getStudents() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "[]");
    }

    return JSON.parse(fs.readFileSync(file, "utf8"));
}

// Save JSON Data
function saveStudents(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// GET - View Students
app.get("/api/students", (req, res) => {
    res.json(getStudents());
});

// POST - Add Student
app.post("/api/students", (req, res) => {

    const { name, rollNo, className, email, phone } = req.body;

    if (!name || !rollNo || !className || !email || !phone) {
        return res.status(400).json({
            message: "Please fill all fields"
        });
    }

    const students = getStudents();

    const duplicate = students.find(
        s => s.rollNo.toLowerCase() === rollNo.toLowerCase()
    );

    if (duplicate) {
        return res.status(400).json({
            message: "Roll Number already exists"
        });
    }

    const newStudent = {
        id: randomUUID(),
        name,
        rollNo,
        className,
        email,
        phone
    };

    students.push(newStudent);
    saveStudents(students);

    res.status(201).json({
        message: "Student Added Successfully",
        student: newStudent
    });
});

// PUT - Update Student
app.put("/api/students/:id", (req, res) => {

    const students = getStudents();

    const index = students.findIndex(
        s => s.id === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            message: "Student Not Found"
        });
    }

    const { name, rollNo, className, email, phone } = req.body;

    if (!name || !rollNo || !className || !email || !phone) {
        return res.status(400).json({
            message: "Please fill all fields"
        });
    }

    const duplicate = students.find(
        s => s.rollNo.toLowerCase() === rollNo.toLowerCase()
          && s.id !== req.params.id
    );

    if (duplicate) {
        return res.status(400).json({
            message: "Roll Number already exists"
        });
    }

    students[index] = {
        id: req.params.id,
        name,
        rollNo,
        className,
        email,
        phone
    };

    saveStudents(students);

    res.json({
        message: "Student Updated Successfully"
    });
});

// DELETE - Delete Student
app.delete("/api/students/:id", (req, res) => {

    let students = getStudents();

    const updatedStudents = students.filter(
        s => s.id !== req.params.id
    );

    if (students.length === updatedStudents.length) {
        return res.status(404).json({
            message: "Student Not Found"
        });
    }

    saveStudents(updatedStudents);

    res.json({
        message: "Student Deleted Successfully"
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
