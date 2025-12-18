"use client";
import { useEffect, useState } from "react";

export default function Resources() {
  const [resources, setResources] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/resources")
      .then(res => res.json())
      .then(setResources);
  }, []);

  return (
    <div>
      {resources.map(r => (
        <div key={r._id}>
          <h3>{r.title}</h3>
          <p>Course: {r.courseName}</p>
          <p>Downloads: {r.downloads}</p>
          <a href={`http://localhost:5000/api/resources/download/${r._id}`}>
            Download
          </a>
        </div>
      ))}
    </div>
  );
}
