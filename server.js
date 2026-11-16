
const express = require("express");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const dataFile = path.join(__dirname, "students.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readStudents() {
    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, "[]");
    }

    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function saveStudents(students) {
    fs.writeFileSync(dataFile, JSON.stringify(students, null, 2));
}

// Get all students
app.get("/api/students", (req, res) => {
    res.json(readStudents());
});

// Add student
app.post("/api/students", (req, res) => {
    const students = readStudents();

    const student = {
        ...req.body,
        id: randomUUID()
    };

    students.push(student);
    saveStudents(students);

    res.status(201).json(student);
});

// Update student
app.put("/api/students/:id", (req, res) => {
    const students = readStudents();

    const index = students.findIndex(
        student => String(student.id) === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({ message: "Student not found" });
    }

    students[index] = {
        ...students[index],
        ...req.body,
        id: req.params.id
    };

    saveStudents(students);
    res.json(students[index]);
});

// Delete student
app.delete("/api/students/:id", (req, res) => {
    const students = readStudents();

    const updatedStudents = students.filter(
        student => String(student.id) !== req.params.id
    );

    if (updatedStudents.length === students.length) {
        return res.status(404).json({ message: "Student not found" });
    }

    saveStudents(updatedStudents);
    res.json({ message: "Student deleted successfully" });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
