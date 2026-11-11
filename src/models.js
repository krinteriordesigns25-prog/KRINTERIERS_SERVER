import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const User = sequelize.define("User", {
  email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
});

// A top-level menu in the website navbar (About Us, Services, Gallery ...)
export const Menu = sequelize.define("Menu", {
  title: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  // defaultMenu: {
  //   type: DataTypes.BOOLEAN,
  //   defaultValue: false,
  // },
  // subMenu: {
  //   type: DataTypes.BOOLEAN,
  //   defaultValue: true,
  // },
});

// A submenu page: header (title/subtitle), content (HTML) and images
export const Page = sequelize.define("Page", {
  title: { type: DataTypes.STRING(200), allowNull: false },
  slug: { type: DataTypes.STRING(190), allowNull: false, unique: true },
  subtitle: { type: DataTypes.STRING(400) },
  content: { type: DataTypes.TEXT },
  headerImage: { type: DataTypes.STRING(1000) },
  images: { type: DataTypes.JSON, defaultValue: [] },
  published: { type: DataTypes.BOOLEAN, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
});

// A Hero Carousel

export const Carousel = sequelize.define(
  "Carousel",
  {
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    header: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subHeader: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "carousels",
    timestamps: true,
  },
);

// REview

export const Review = sequelize.define(
  "Review",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: true, len: [2, 120] },
    },
    role: {
      type: DataTypes.STRING(120),
      allowNull: true,
      defaultValue: "",
    },
    rating: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 5,
      validate: { min: 1, max: 5 },
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true, len: [5, 2000] },
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "reviews",
    timestamps: true,
    indexes: [{ fields: ["isActive", "sortOrder"] }],
  },
);
// FAQ

export const FAQ = sequelize.define(
  "FAQ",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    question: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: { notEmpty: true },
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "faqs",
    timestamps: true,
    indexes: [{ fields: ["isActive", "sortOrder"] }],
  },
);

export const Project = sequelize.define(
  "Project",
  {
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },

    location: DataTypes.STRING(150),
    propertyType: DataTypes.STRING(150),
    category: DataTypes.STRING(100),
    size: DataTypes.STRING(100),
    clientName: DataTypes.STRING(150),
    duration: DataTypes.STRING(100),
    theme: DataTypes.STRING(150),

    shortDescription: DataTypes.TEXT,
    description: DataTypes.TEXT,

    coverImage: DataTypes.STRING(1000),

    scopeOfWork: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },

    gallery: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },

    sections: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },

    status: {
      type: DataTypes.ENUM("draft", "published"),
      defaultValue: "draft",
      allowNull: false,
    },

    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "projects",
    timestamps: true,
  },
);

export const DesignCategory = sequelize.define(
  "DesignCategory",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "design_categories",
    timestamps: true,
  },
);

export const DesignGallery = sequelize.define(
  "DesignGallery",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(220),
      allowNull: false,
      unique: true,
    },
    style: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coverImage: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    suitableFor: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("draft", "published"),
      defaultValue: "draft",
    },
  },
  {
    tableName: "design_galleries",
    timestamps: true,
  },
);
export const DesignFAQ = sequelize.define(
  "DesignFAQ",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    question: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "design_faqs",
    timestamps: true,
  },
);

DesignCategory.hasMany(DesignGallery, {
  foreignKey: "categoryId",
  as: "designs",
  onDelete: "CASCADE",
});

DesignGallery.belongsTo(DesignCategory, {
  foreignKey: "categoryId",
  as: "category",
});

DesignCategory.hasMany(DesignFAQ, {
  foreignKey: "categoryId",
  as: "faqs",
  onDelete: "CASCADE",
});

DesignFAQ.belongsTo(DesignCategory, {
  foreignKey: "categoryId",
  as: "category",
});

Menu.hasMany(Page, {
  as: "pages",
  foreignKey: { name: "menuId", allowNull: false },
  onDelete: "RESTRICT",
});
Page.belongsTo(Menu, {
  as: "menu",
  foreignKey: { name: "menuId", allowNull: false },
});
