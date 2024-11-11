const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const pdf = require("pdf-creator-node");
const fs = require("fs");
const { Parser } = require("json2csv");
const Employee = require("./models/ShiftModel");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5001;


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,useUnifiedTopology: true,
}).then(() => console.log("Connected "))
  .catch(err => console.error(" connection error:", err));

app.use(cors());
app.use(bodyParser.json());

// Hard-coded machine lists by department
const departmentMachines = {
  A: ["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10"],
  B: ["B1","B2","B3","B4","B5","B6","B7","B8","B9","B10"],
  C: ["C1","C2","C3","C4","C5","C6","C7","C8","C9","C10"],
  D: ["D1","D2","D3","D4","D5","D6","D7","D8","D9","D10"]
};


const machineAssignments = { A: 0, B: 0, C: 0, D: 0 };


app.post("/api/employees", async (req, res) => {
  const { name, department } = req.body;

  if (!departmentMachines[department]) {
    return res.status(400).send("Invalid department selected.");
  }
 const machineList = departmentMachines[department];
  const assignedMachine = machineList[machineAssignments[department]];
  machineAssignments[department] = (machineAssignments[department] + 1) % machineList.length;
 try {
    const newEmployee = new Employee({
      name,
      department,
      machine: assignedMachine,
      status: "Not Active",
      feedback: ""
    });
    await newEmployee.save();
    res.status(201).send(newEmployee);
  } catch (error) {
    console.error("Error adding employee:", error);
    res.status(500).send("Error adding employee.");
  }
});

app.put("/api/employees/:id",async (req,res) => {
  const { id } = req.params;
  const { status, feedback } = req.body;
 try {
    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { status, feedback },
      { new: true } // This option returns the updated document
    );
   if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }
   res.json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.get("/api/employees", async (req, res) => {
  try {
  const employees = await Employee.find();
   res.send(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).send("Error fetching employees.");
  }
});



app.get("/api/employees/pdf", async (req, res) => {
  try {
    const employees = await Employee.find();
const html = `
      <html>
       <head>
        <style>
        table { width: 100%; border-collapse: collapse; }
         th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
         th { background-color: #f2f2f2; }
        .feedback { word-wrap: break-word; max-width: 200px; }
        </style>
        </head>
        <body>
        <h1>Employee Report</h1>
         <table>
          <tr>
           <th>Name</th>
            <th>Department</th>
            <th>Machine</th>
             <th>Status</th>
            <th>Feedback</th>
            <th>Timestamp</th>
            </tr>
            ${employees.map(emp => `
             <tr>
              <td>${emp.name}</td>
              <td>${emp.department}</td>
               <td>${emp.machine}</td>
              <td>${emp.status}</td>
               <td class="feedback">${emp.feedback || ""}</td>
               <td>${emp.timestamp.toLocaleString()}</td>
            </tr>
         `).join("")}
        </table>
        </body>
      </html>
    `;

    const document = {
      html: html,
      data: {},  // Required field, even if empty
      path: "./employees.pdf",  // Required field
    };

    const options = {
      format: "A4",
      orientation: "portrait",
      border: "10mm",
    };
  await pdf.create(document, options);
    res.download("./employees.pdf", "employees.pdf", () => {
      fs.unlinkSync("./employees.pdf"); // Delete the file after download
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error generating PDF.");
  }
});





 
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
