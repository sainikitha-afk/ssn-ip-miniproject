import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import useAuth()

const ProjectTable = () => {
  const { user } = useAuth(); // Get logged-in user
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return; // Prevent fetching if not logged in

    const fetchProjects = async () => {
      try {
        const response = await axios.get("http://localhost:5000/projects");
        setProjects(response.data);
      } catch (err) {
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  const handleDelete = async (id) => {
    if (!user) return alert("You must be logged in to delete a project.");
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await axios.delete(`http://localhost:5000/projects/${id}`);
        setProjects(projects.filter((project) => project.ID !== id));
      } catch (err) {
        alert("Failed to delete project");
      }
    }
  };

  if (!user) return <h2>Please log in to view projects.</h2>;
  if (loading) return <div>Loading projects...</div>;
  if (error) return <div className="error">{error}</div>;
  if (projects.length === 0) return <div>No projects found</div>;

  return (
    <div className="project-table-container">
      <h2>Your Consultancy Projects</h2>

      <div className="actions-header">
        <button onClick={() => navigate("/projects/add")} className="add-btn">
          + Add Project
        </button>
      </div>

      <table className="project-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Project Title</th>
            <th>Industry</th>
            <th>Academic Year</th>
            <th>Amount (₹)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.ID}>
              <td>{project.ID}</td>
              <td>{project["Project Title"]}</td>
              <td>{project["Industry Name"]}</td>
              <td>{project["Academic Year"]}</td>
              <td>{project["Amount Sanctioned"]}</td>
              <td className="actions">
                <Link to={`/edit-project/${project.ID}`} className="edit-btn">
                  Edit
                </Link>
                <button onClick={() => handleDelete(project.ID)} className="delete-btn">
                  Delete
                </button>
                <button onClick={() => navigate(`/view-project/${project.ID}`)} className="view-btn">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectTable;
