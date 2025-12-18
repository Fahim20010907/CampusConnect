"use client";
import { useState } from "react";

export default function UploadResource() {
  const [form, setForm] = useState({ title: "", courseName: "", subject: "" });
  const [file, setFile] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", form.title);
    data.append("courseName", form.courseName);
    data.append("subject", form.subject);
    data.append("file", file);

    await fetch("http://localhost:5000/api/resources/upload", {
      method: "POST",
      body: data
    });

    alert("Resource uploaded");
  };

  return (
    <form onSubmit={submit}>
      <input placeholder="Title" onChange={e => setForm({...form, title:e.target.value})} />
      <input placeholder="Course Name" onChange={e => setForm({...form, courseName:e.target.value})} />
      <input placeholder="Subject" onChange={e => setForm({...form, subject:e.target.value})} />
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button type="submit">Upload</button>
    </form>
  );
}
