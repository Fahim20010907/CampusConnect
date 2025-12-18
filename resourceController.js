import Resource from "../models/resource.js";
import path from "path";

export const uploadResource = async (req, res) => {
  try {
    const resource = new Resource({
      title: req.body.title,
      courseName: req.body.courseName,
      subject: req.body.subject,
      filePath: req.file.path,
      uploadedBy: req.user?.id
    });

    await resource.save();
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getResources = async (req, res) => {
  const resources = await Resource.find();
  res.json(resources);
};

export const downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    resource.downloads += 1;
    await resource.save();

    res.download(path.resolve(resource.filePath));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
