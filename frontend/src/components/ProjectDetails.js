import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const ProjectDetails = () => {
    const { id } = useParams(); // Get project ID from URL
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(`http://localhost:5000/projects/${id}`)
            .then(response => {
                setProject(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching project:", error);
                setError("Project not found");
                setLoading(false);
            });
    }, [id]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Project Details</h2>
            <p><strong>Industry Name:</strong> {project["Industry Name"]}</p>
            <p><strong>Project Title:</strong> {project["Project Title"]}</p>
            <p><strong>Academic Year:</strong> {project["Academic Year"]}</p>
            <p><strong>Amount Sanctioned:</strong> {project["Amount Sanctioned"]}</p>
        </div>
    );
};

export default ProjectDetails;
