const express = require("express");
const multer = require("multer");
const cors = require("cors");
const XLSX = require("xlsx");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
const PORT = 5000;
const SECRET_KEY = "mysecretkey"; // Use environment variable in production

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Helper functions
function readExcel(filename) {
  const workbook = XLSX.readFile(filename);
  const sheetName = workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

function writeExcel(filename, data) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, filename);
}

function generateId(projects) {
  return (
    Math.max(0, ...projects.map((p) => (typeof p.ID === "number" ? p.ID : parseInt(p.ID) || 0))) + 1
  );
}

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.sendStatus(401);
  jwt.verify(token.split(" ")[1], SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// User Registration
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const users = readExcel("users.xlsx");

  if (users.some((u) => u.email === email)) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ name, email, password: hashedPassword });
  writeExcel("users.xlsx", users);
  res.status(201).json({ message: "User registered successfully" });
});

// User Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const users = readExcel("users.xlsx");
  const user = users.find((u) => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ token });
});

// Get all projects
app.get("/projects", authenticateToken, (req, res) => {
  const projects = readExcel("projects.xlsx");
  res.json(projects);
});

// Add a new project
app.post(
  "/projects",
  authenticateToken,
  upload.fields([
    { name: "billSettlementFile" },
    { name: "agreementFile" },
  ]),
  (req, res) => {
    const projects = readExcel("projects.xlsx");

    const newProject = {
      ID: generateId(projects),
      industryName: req.body.industryName || "",
      projectTitle: req.body.projectTitle || "",
      academicYear: req.body.academicYear || "",
      amountSanctioned: parseFloat(req.body.amountSanctioned) || 0,
      amountReceived: parseFloat(req.body.amountReceived) || 0,
      studentDetails: req.body.studentDetails || "",
      projectSummary: req.body.projectSummary || "",
      billSettlementFile: req.files?.billSettlementFile?.[0]?.filename || "",
      agreementFile: req.files?.agreementFile?.[0]?.filename || "",
      createdBy: req.user.email,
      createdAt: new Date().toISOString(),
    };

    console.log("New Project:", newProject); // Debugging

    projects.push(newProject);
    writeExcel("projects.xlsx", projects);
    res.status(201).json(newProject);
  }
);

// Update a project
app.put("/projects/:id", authenticateToken, upload.fields([
  { name: "agreementFile" },
  { name: "billSettlement" },
]), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let data = readExcel("projects.xlsx");
    const index = data.findIndex((p) => parseInt(p.ID) === id);

    if (index === -1) {
      return res.status(404).json({ error: "Project not found" });
    }

    const existing = data[index];

    // Parse and sanitize incoming values
    const updates = {
      industryName: req.body.industryName,
      projectTitle: req.body.projectTitle,
      academicYear: req.body.academicYear,
      amountSanctioned: parseFloat(req.body.amountSanctioned),
      amountReceived: parseFloat(req.body.amountReceived),
      studentDetails: req.body.studentDetails,
      projectSummary: req.body.projectSummary,
    };

    console.log("Updates:", updates);
    console.log("Files:", req.files);

    // Construct new entry
    const updatedEntry = {
      ...existing,
      ...updates,
      ID: existing.ID,
      createdBy: existing.createdBy,
      createdAt: existing.createdAt,
    };

    // Handle files if uploaded
    const files = req.files;
    if (files?.agreementFile?.[0]) {
      updatedEntry.agreementFile = files.agreementFile[0].path.replace(/\\/g, "/");
    }
    if (files?.billSettlement?.[0]) {
      updatedEntry.billSettlement = files.billSettlement[0].path.replace(/\\/g, "/");
    }

    data[index] = updatedEntry;
    writeExcel("projects.xlsx", data);

    res.json({ message: "Project updated successfully", updatedEntry });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// Get a project by ID (only if user owns it)
app.get("/projects/:id", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const projects = readExcel("projects.xlsx");

  const project = projects.find(
    (p) => parseInt(p.ID) === id && p.createdBy === req.user.email
  );

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  res.json(project);
});

// Delete a project
app.delete("/projects/:id", authenticateToken, (req, res) => {
  let projects = readExcel("projects.xlsx");
  const id = parseInt(req.params.id);
  const projectIndex = projects.findIndex((p) => parseInt(p.ID) === id);
  if (projectIndex === -1) {
    return res.status(404).json({ message: "Project not found" });
  }
  projects.splice(projectIndex, 1);
  writeExcel("projects.xlsx", projects);
  res.json({ message: "Project deleted successfully" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
