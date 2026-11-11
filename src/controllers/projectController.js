import { Op } from "sequelize";
import { Project } from "../models.js";
import { uploadProjectImages } from "../projectImageService.js";

const createSlug = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const parseArray = (value, fallback = []) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (Array.isArray(value)) return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getProjectPayload = (body) => ({
  title: body.title?.trim(),
  slug: createSlug(body.slug || body.title),
  location: body.location || "",
  propertyType: body.propertyType || "",
  category: body.category || "Residential",
  size: body.size || "",
  clientName: body.clientName || "",
  duration: body.duration || "",
  theme: body.theme || "",
  shortDescription: body.shortDescription || "",
  description: body.description || "",
  coverImage: body.coverImage || "",
  scopeOfWork: parseArray(body.scopeOfWork),
  gallery: parseArray(body.gallery),
  sections: parseArray(body.sections),
  status: body.status || "draft",
  sortOrder: Number(body.sortOrder || 0),
});

// PUBLIC: GET /api/projects
export const getPublicProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { status: "published" },
      order: [
        ["sortOrder", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PUBLIC: GET /api/projects/:slug
export const getPublicProjectBySlug = async (req, res) => {
  console.log("DSFA");

  try {
    const project = await Project.findOne({
      where: {
        slug: req.params.slug,
        status: "published",
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN: GET /api/projects/admin
export const getAdminProjects = async (req, res) => {
  console.log("SDAF");

  try {
    const projects = await Project.findAll({
      order: [
        ["sortOrder", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN: POST /api/projects/admin
export const createProject = async (req, res) => {
  try {
    if (!req.body.title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project title is required",
      });
    }

    const payload = getProjectPayload(req.body);

    const existing = await Project.findOne({
      where: { slug: payload.slug },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A project with this slug already exists",
      });
    }

    const project = await Project.create(payload);

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN: PUT /api/projects/admin/:id
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const payload = getProjectPayload({
      ...project.toJSON(),
      ...req.body,
    });

    const duplicate = await Project.findOne({
      where: {
        slug: payload.slug,
        id: { [Op.ne]: project.id },
      },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Another project already uses this slug",
      });
    }

    await project.update(payload);

    res.json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN: DELETE /api/projects/admin/:id
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await project.destroy();

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN: PATCH /api/projects/admin/:id/status
export const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project status",
      });
    }

    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await project.update({ status });

    res.json({
      success: true,
      message: "Project status updated",
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN: PATCH /api/projects/admin/reorder
export const reorderProjects = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({
        success: false,
        message: "orderedIds must be an array",
      });
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        Project.update({ sortOrder: index }, { where: { id } }),
      ),
    );

    res.json({
      success: true,
      message: "Project order updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// // ADMIN: POST /api/projects/admin/upload
// export const uploadProjectImages = async (req, res) => {
//   try {
//     const files = req.files || [];

//     const images = files.map((file) => ({
//       url: `/uploads/projects/${file.filename}`,
//       name: file.originalname,
//       size: file.size,
//       type: file.mimetype,
//     }));

//     res.status(201).json({
//       success: true,
//       data: images,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const uploadProjectAssets = async (req, res) => {
  try {
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one image",
      });
    }

    const images = await uploadProjectImages(files);

    return res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      data: images,
    });
  } catch (error) {
    console.error("Project image upload error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Image upload failed",
    });
  }
};
