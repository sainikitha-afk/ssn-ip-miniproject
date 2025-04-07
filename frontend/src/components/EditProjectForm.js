import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const EditProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [existingAgreement, setExistingAgreement] = useState(null);
  const [existingBill, setExistingBill] = useState(null);
  const [newFileSelected, setNewFileSelected] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(`http://localhost:5000/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data) {
          setProject(res.data);
          setExistingAgreement(res.data.agreementFile);
          setExistingBill(res.data.billSettlement);
        } else {
          navigate("/not-found");
        }
      })
      .catch((err) => {
        console.error("Error fetching project:", err);
        navigate("/not-found");
      });
  }, [id, navigate, token]);

  const handleChange = (e) => {
    setProject({ ...project, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const { name } = e.target;

    setProject({ ...project, [name]: file });
    setNewFileSelected(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(project).forEach((key) => {
      if ((key === "agreementFile" || key === "billSettlement") && !newFileSelected) return;
      formData.append(key, project[key] || "");
    });

    try {
      console.log("Submitting project data:", project);
      for (let [key, value] of formData.entries()) {
        console.log(key, value);}
        await axios.put(`http://localhost:5000/projects/${id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
        },
          });
      alert("Project updated successfully!");
      navigate("/projects");
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project.");
    }
  };

  if (project === null) return <div>Loading...</div>;

  return (
    <div>
      <h2>Edit Project</h2>
      <form onSubmit={handleSubmit}>
        <label>Industry Name:</label>
        <input type="text" name="industryName" value={project.industryName || ""} onChange={handleChange} required />

        <label>Project Title:</label>
        <input type="text" name="projectTitle" value={project.projectTitle || ""} onChange={handleChange} required />

        <label>Academic Year:</label>
        <input type="text" name="academicYear" value={project.academicYear || ""} onChange={handleChange} required />

        <label>Amount Sanctioned:</label>
        <input type="number" name="amountSanctioned" value={project.amountSanctioned || ""} onChange={handleChange} required />

        <label>Amount Received:</label>
        <input type="number" name="amountReceived" value={project.amountReceived || ""} onChange={handleChange} required />

        <label>Bill Settlement (PDF):</label>
        <input type="file" name="billSettlement" onChange={handleFileChange} />
        {!newFileSelected && existingBill && <p>Currently uploaded: {existingBill}</p>}

        <label>Agreement Document (PDF):</label>
        <input type="file" name="agreementFile" onChange={handleFileChange} />
        {!newFileSelected && existingAgreement && <p>Currently uploaded: {existingAgreement}</p>}

        <label>Student Details:</label>
        <textarea name="studentDetails" value={project.studentDetails || ""} onChange={handleChange} required />

        <label>Project Summary (Max 100 words):</label>
        <textarea name="projectSummary" value={project.projectSummary || ""} onChange={handleChange} maxLength="600" required />

        <button type="submit">Update</button>
      </form>
    </div>
  );
};

export default EditProjectForm;
