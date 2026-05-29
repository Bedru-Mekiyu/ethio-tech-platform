import Track from "../models/Track.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";
import Project from "../models/Project.js";
import DailyChallenge from "../models/DailyChallenge.js";
import Badge from "../models/Badge.js";
import LevelConfig from "../models/LevelConfig.js";

import { TRACK_SLUGS } from "./datasets.js";
import { sleep, randomInt, daysAgo } from "./utils.js";
import {
  createDailyChallenge,
  createBadge,
  createLevelConfig,
} from "./factories.js";

// ====== TRACK & CONTENT GENERATORS ======

const MODULE_CONTENT = {
  web: [
    {
      title: "HTML & CSS Fundamentals",
      description: "Master semantic HTML and modern CSS for building responsive web pages",
      lessons: [
        {
          title: "Introduction to HTML",
          content: "Learn the structure of HTML documents, semantic elements, and best practices",
          xpReward: 50,
          durationMinutes: 45,
        },
        {
          title: "Styling with CSS",
          content: "Explore CSS selectors, properties, and creating beautiful layouts",
          xpReward: 50,
          durationMinutes: 50,
        },
        {
          title: "Responsive Design",
          content: "Build mobile-first responsive layouts using Flexbox and Grid",
          xpReward: 60,
          durationMinutes: 55,
        },
        {
          title: "CSS Animations",
          content: "Create smooth animations and transitions for interactive user experiences",
          xpReward: 55,
          durationMinutes: 40,
        },
      ],
    },
    {
      title: "JavaScript Essentials",
      description: "Master JavaScript fundamentals for interactive web applications",
      lessons: [
        {
          title: "Variables and Data Types",
          content: "Understand JavaScript variables, data types, and type coercion",
          xpReward: 50,
          durationMinutes: 40,
        },
        {
          title: "Control Flow",
          content: "Learn if/else, loops, and conditional logic",
          xpReward: 50,
          durationMinutes: 45,
        },
        {
          title: "Functions and Scope",
          content: "Master function declarations, scope, and closures",
          xpReward: 60,
          durationMinutes: 50,
        },
        {
          title: "DOM Manipulation",
          content: "Interact with HTML elements using JavaScript",
          xpReward: 60,
          durationMinutes: 45,
        },
      ],
    },
    {
      title: "React Basics",
      description: "Build interactive user interfaces with React",
      lessons: [
        {
          title: "Components and JSX",
          content: "Learn React components and JSX syntax",
          xpReward: 70,
          durationMinutes: 50,
        },
        {
          title: "State and Props",
          content: "Manage component state and pass data between components",
          xpReward: 70,
          durationMinutes: 55,
        },
        {
          title: "Hooks",
          content: "Use React hooks like useState, useEffect, and custom hooks",
          xpReward: 80,
          durationMinutes: 60,
        },
        {
          title: "Component Lifecycle",
          content: "Understand component mounting, updating, and unmounting",
          xpReward: 70,
          durationMinutes: 50,
        },
      ],
    },
  ],
  ai: [
    {
      title: "Machine Learning Fundamentals",
      description: "Introduction to ML concepts, algorithms, and applications",
      lessons: [
        {
          title: "What is Machine Learning?",
          content: "Understand supervised, unsupervised, and reinforcement learning",
          xpReward: 60,
          durationMinutes: 50,
        },
        {
          title: "Data Preprocessing",
          content: "Prepare and clean data for machine learning models",
          xpReward: 70,
          durationMinutes: 55,
        },
        {
          title: "Classification Models",
          content: "Build and evaluate classification models",
          xpReward: 80,
          durationMinutes: 60,
        },
        {
          title: "Regression Analysis",
          content: "Predict continuous values using regression algorithms",
          xpReward: 80,
          durationMinutes: 60,
        },
      ],
    },
    {
      title: "Deep Learning",
      description: "Neural networks and advanced deep learning architectures",
      lessons: [
        {
          title: "Neural Network Basics",
          content: "Understand neurons, layers, and activation functions",
          xpReward: 80,
          durationMinutes: 60,
        },
        {
          title: "CNNs for Vision",
          content: "Convolutional neural networks for image classification",
          xpReward: 90,
          durationMinutes: 65,
        },
        {
          title: "RNNs and Sequences",
          content: "Recurrent neural networks for sequential data",
          xpReward: 90,
          durationMinutes: 65,
        },
        {
          title: "Transformers and NLP",
          content: "Modern transformers for natural language processing",
          xpReward: 100,
          durationMinutes: 70,
        },
      ],
    },
  ],
  cyber: [
    {
      title: "Security Fundamentals",
      description: "Core concepts in cybersecurity and threat prevention",
      lessons: [
        {
          title: "Security Principles",
          content: "CIA Triad, defense in depth, and security best practices",
          xpReward: 60,
          durationMinutes: 45,
        },
        {
          title: "Common Vulnerabilities",
          content: "OWASP top 10, SQL injection, XSS, and CSRF attacks",
          xpReward: 70,
          durationMinutes: 55,
        },
        {
          title: "Cryptography Basics",
          content: "Encryption, hashing, and digital signatures",
          xpReward: 70,
          durationMinutes: 50,
        },
        {
          title: "Network Security",
          content: "Firewalls, VPNs, intrusion detection, and monitoring",
          xpReward: 70,
          durationMinutes: 55,
        },
      ],
    },
  ],
};

const PROJECT_CONTENT = {
  web: [
    {
      title: "Personal Portfolio Website",
      description:
        "Build a responsive portfolio showcasing your projects and skills with HTML, CSS, and JavaScript",
      difficulty: "easy",
      xpReward: 300,
      requirements: [
        "Create a responsive layout that works on mobile and desktop",
        "Include projects showcase section",
        "Add contact form functionality",
        "Deploy to GitHub Pages or Netlify",
      ],
    },
    {
      title: "E-commerce Product Page",
      description:
        "Build a functional e-commerce product page with React, featuring product filtering and cart management",
      difficulty: "medium",
      xpReward: 600,
      requirements: [
        "Display products with images and descriptions",
        "Implement product filtering and search",
        "Add shopping cart functionality",
        "Use React hooks for state management",
        "Deploy the application",
      ],
    },
    {
      title: "Social Media Dashboard",
      description:
        "Create a real-time social media dashboard with live data feeds and user interactions",
      difficulty: "hard",
      xpReward: 1000,
      requirements: [
        "Real-time data updates with WebSockets",
        "User authentication and authorization",
        "Post creation and interaction features",
        "Performance optimizations",
        "Responsive design for all devices",
      ],
    },
  ],
  ai: [
    {
      title: "Iris Flower Classification",
      description:
        "Build your first ML model to classify iris flowers using scikit-learn",
      difficulty: "easy",
      xpReward: 300,
      requirements: [
        "Load and explore the iris dataset",
        "Split data into train/test sets",
        "Train a classification model",
        "Evaluate model performance",
        "Document your findings",
      ],
    },
    {
      title: "House Price Prediction",
      description:
        "Predict house prices using regression models and real-world data",
      difficulty: "medium",
      xpReward: 600,
      requirements: [
        "Collect and preprocess housing data",
        "Feature engineering and selection",
        "Train multiple regression models",
        "Cross-validation and hyperparameter tuning",
        "Deploy model as API",
      ],
    },
  ],
};

export async function createTracksAndContent() {
  const created = [];

  for (const trackDef of TRACK_SLUGS) {
    const track = await Track.create({
      title: trackDef.title,
      description: trackDef.description,
      category: trackDef.category,
      xpReward: trackDef.category === "beginner" ? 500 : 1000,
      estimatedWeeks: trackDef.category === "beginner" ? 8 : 12,
    });

    const modules = [];
    const content = MODULE_CONTENT[trackDef.key] || [];

    for (let m = 0; m < Math.min(content.length, 4); m++) {
      const moduleDef = content[m];
      const module = await Module.create({
        title: moduleDef.title,
        description: moduleDef.description,
        track: track._id,
        order: m,
      });

      const lessons = [];
      for (let l = 0; l < (moduleDef.lessons?.length || 4); l++) {
        const lessonDef = moduleDef.lessons?.[l] || {};
        const lesson = await Lesson.create({
          title: lessonDef.title || `Lesson ${l + 1}`,
          content: lessonDef.content || `Content for ${moduleDef.title} - Lesson ${l + 1}`,
          xpReward: lessonDef.xpReward || 50 + l * 10,
          module: module._id,
          durationMinutes: lessonDef.durationMinutes || 45 + l * 5,
          order: l,
          quiz: [
            {
              question: "What did you learn in this lesson?",
              options: ["Concept A", "Concept B", "Concept C", "Concept D"],
              correctIndex: randomInt(0, 3),
            },
          ],
        });
        lessons.push(lesson);
      }

      module.lessons = lessons.map((x) => x._id);
      await module.save();
      modules.push(module);
    }

    track.modules = modules.map((x) => x._id);

    // Create projects for track
    const projects = [];
    const projectContent = PROJECT_CONTENT[trackDef.key] || [];

    for (let p = 0; p < Math.min(projectContent.length, 3); p++) {
      const projectDef = projectContent[p];
      const project = await Project.create({
        title: projectDef.title,
        description: projectDef.description,
        track: track._id,
        difficulty: projectDef.difficulty || "easy",
        xpReward: projectDef.xpReward || 300 + p * 300,
        requirements: projectDef.requirements || [`Complete all requirements for ${trackDef.title}`],
        githubTemplate: `https://github.com/ethiotech/template-${trackDef.key}-project-${p + 1}`,
      });
      projects.push(project);
    }

    await track.save();
    created.push(track);
    await sleep(20);
  }

  return created;
}

// ====== BADGE & GAMIFICATION GENERATORS ======

export async function createBadgesAndLevels() {
  const badges = [
    createBadge({
      name: "First Step",
      description: "Complete your first lesson",
      xpRequired: 50,
      xpBonus: 20,
      category: "achievement",
    }),
    createBadge({
      name: "Lesson Master",
      description: "Complete 10 lessons",
      xpRequired: 500,
      xpBonus: 50,
      category: "achievement",
    }),
    createBadge({
      name: "Project Champion",
      description: "Get your first project approved",
      xpRequired: 600,
      xpBonus: 100,
      category: "skill",
    }),
    createBadge({
      name: "Community Helper",
      description: "Help 5 peers in discussions",
      xpRequired: 300,
      xpBonus: 75,
      category: "community",
    }),
    createBadge({
      name: "Week Warrior",
      description: "Maintain a 7-day streak",
      xpRequired: 400,
      xpBonus: 80,
      category: "achievement",
    }),
    createBadge({
      name: "Month Champion",
      description: "Maintain a 30-day streak",
      xpRequired: 1500,
      xpBonus: 150,
      category: "achievement",
    }),
    createBadge({
      name: "Rising Star",
      description: "Reach level 10",
      xpRequired: 5000,
      xpBonus: 200,
      category: "achievement",
    }),
  ];

  const createdBadges = await Badge.insertMany(badges);

  // Create level configs
  const levels = [];
  for (let i = 1; i <= 25; i++) {
    levels.push(createLevelConfig(i));
  }

  const createdLevels = await LevelConfig.insertMany(levels);

  return { badges: createdBadges, levels: createdLevels };
}

// ====== DAILY CHALLENGE GENERATORS ======

export async function createDailyChallengesForMonth() {
  const today = new Date();
  const challenges = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    challenges.push(createDailyChallenge(date, i));
  }

  return await DailyChallenge.insertMany(challenges);
}
