import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertJobSchema, insertApplicationSchema, insertResumeSchema, insertNotificationSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Multer configuration for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      
      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await storage.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      
      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Job routes
  app.get("/api/jobs", async (req, res) => {
    try {
      const { location, type, search } = req.query;
      const jobs = await storage.getJobs({
        location: location as string,
        type: type as string,
        search: search as string
      });
      
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/jobs", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'faculty') {
        return res.status(403).json({ message: "Only faculty can post jobs" });
      }

      const jobData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(jobData, req.user.id);
      
      res.status(201).json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJobById(parseInt(req.params.id));
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/jobs/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'faculty') {
        return res.status(403).json({ message: "Only faculty can update jobs" });
      }

      const jobData = insertJobSchema.partial().parse(req.body);
      const job = await storage.updateJob(parseInt(req.params.id), jobData);
      
      res.json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/jobs/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'faculty') {
        return res.status(403).json({ message: "Only faculty can delete jobs" });
      }

      const success = await storage.deleteJob(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json({ message: "Job deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Application routes
  app.post("/api/applications", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: "Only students can apply for jobs" });
      }

      const applicationData = insertApplicationSchema.parse({
        ...req.body,
        studentId: req.user.id
      });

      // Check if already applied
      const existingApplication = await storage.checkExistingApplication(
        req.user.id, 
        applicationData.jobId
      );
      if (existingApplication) {
        return res.status(400).json({ message: "Already applied for this job" });
      }

      const application = await storage.createApplication(applicationData);
      res.status(201).json(application);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/applications/my", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: "Only students can view their applications" });
      }

      const applications = await storage.getApplicationsByStudent(req.user.id);
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/applications", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'faculty') {
        return res.status(403).json({ message: "Only faculty can view all applications" });
      }

      const applications = await storage.getAllApplications();
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/applications/:id/status", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'faculty') {
        return res.status(403).json({ message: "Only faculty can update application status" });
      }

      const { status, rejectionReason } = req.body;
      const application = await storage.updateApplicationStatus(
        parseInt(req.params.id), 
        status, 
        rejectionReason
      );
      
      res.json(application);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Resume routes
  app.post("/api/resumes", authenticateToken, upload.single('resume'), async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: "Only students can upload resumes" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const resumeData = {
        studentId: req.user.id,
        fileName: req.file.originalname,
        filePath: req.file.path,
        isDefault: req.body.isDefault === 'true'
      };

      const resume = await storage.createResume(resumeData);
      res.status(201).json(resume);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/resumes/my", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: "Only students can view their resumes" });
      }

      const resumes = await storage.getResumesByStudent(req.user.id);
      res.json(resumes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/resumes/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: "Only students can delete their resumes" });
      }

      const success = await storage.deleteResume(parseInt(req.params.id), req.user.id);
      if (!success) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      res.json({ message: "Resume deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/resumes/:id/default", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: "Only students can set default resume" });
      }

      const success = await storage.setDefaultResume(parseInt(req.params.id), req.user.id);
      if (!success) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      res.json({ message: "Default resume updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Saved jobs routes
  app.post("/api/saved-jobs", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: "Only students can save jobs" });
      }

      const { jobId } = req.body;
      const savedJob = await storage.saveJob(req.user.id, jobId);
      res.status(201).json(savedJob);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/saved-jobs/:jobId", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: "Only students can unsave jobs" });
      }

      const success = await storage.unsaveJob(req.user.id, parseInt(req.params.jobId));
      if (!success) {
        return res.status(404).json({ message: "Saved job not found" });
      }
      
      res.json({ message: "Job unsaved successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/saved-jobs", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: "Only students can view saved jobs" });
      }

      const savedJobs = await storage.getSavedJobs(req.user.id);
      res.json(savedJobs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User management routes
  app.get("/api/users/departments/:department", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'faculty') {
        return res.status(403).json({ message: "Only faculty can view department students" });
      }

      const students = await storage.getUsersByDepartment(req.params.department);
      res.json(students.map(student => ({ ...student, password: undefined })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/users/profile", authenticateToken, async (req: any, res) => {
    try {
      const updates = insertUserSchema.partial().parse(req.body);
      delete updates.password; // Don't allow password updates through this endpoint
      
      const user = await storage.updateUser(req.user.id, updates);
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Notification routes
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req: any, res) => {
    try {
      const success = await storage.markNotificationAsRead(parseInt(req.params.id), req.user.id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notifications/unread-count", authenticateToken, async (req: any, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user.id);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
