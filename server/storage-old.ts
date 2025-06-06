import { 
  users, jobs, applications, resumes, savedJobs, notifications,
  type User, type InsertUser, type Job, type InsertJob, 
  type Application, type InsertApplication, type Resume, type InsertResume,
  type SavedJob, type Notification, type InsertNotification,
  type JobWithDetails, type ApplicationWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, ilike, or } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  getUsersByDepartment(department: string): Promise<User[]>;
  
  // Authentication
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  
  // Job operations
  createJob(job: InsertJob, postedBy: number): Promise<Job>;
  getJobs(filters?: { location?: string; type?: string; search?: string }, userId?: number): Promise<JobWithDetails[]>;
  getJobById(id: number): Promise<Job | undefined>;
  updateJob(id: number, updates: Partial<InsertJob>): Promise<Job>;
  deleteJob(id: number): Promise<boolean>;
  getJobsByPostedBy(userId: number): Promise<Job[]>;
  
  // Application operations
  createApplication(application: InsertApplication): Promise<Application>;
  getApplicationsByStudent(studentId: number): Promise<ApplicationWithDetails[]>;
  getApplicationsByJob(jobId: number): Promise<ApplicationWithDetails[]>;
  updateApplicationStatus(id: number, status: string, rejectionReason?: string): Promise<Application>;
  checkExistingApplication(studentId: number, jobId: number): Promise<Application | undefined>;
  getAllApplications(): Promise<ApplicationWithDetails[]>;
  
  // Resume operations
  createResume(resume: InsertResume): Promise<Resume>;
  getResumesByStudent(studentId: number): Promise<Resume[]>;
  deleteResume(id: number, studentId: number): Promise<boolean>;
  setDefaultResume(id: number, studentId: number): Promise<boolean>;
  getResumeById(id: number): Promise<Resume | undefined>;
  
  // Saved jobs operations
  saveJob(studentId: number, jobId: number): Promise<SavedJob>;
  unsaveJob(studentId: number, jobId: number): Promise<boolean>;
  getSavedJobs(studentId: number): Promise<JobWithDetails[]>;
  checkSavedJob(studentId: number, jobId: number): Promise<boolean>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number, userId: number): Promise<boolean>;
  getUnreadNotificationCount(userId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      // Check if sample users already exist
      const existingStudent = await this.getUserByEmail("student@university.edu");
      const existingFaculty = await this.getUserByEmail("faculty@university.edu");

      if (!existingStudent) {
        await this.createUser({
          email: "student@university.edu",
          password: "password123",
          firstName: "John",
          lastName: "Doe",
          phone: "+1234567890",
          role: "student",
          department: "Computer Science",
          rollNumber: "CS2023001",
          cgpa: "8.5",
          skills: ["JavaScript", "React", "Node.js", "Python"],
        });
      }

      if (!existingFaculty) {
        await this.createUser({
          email: "faculty@university.edu",
          password: "password123",
          firstName: "Dr. Jane",
          lastName: "Smith",
          phone: "+1234567891",
          role: "faculty",
          department: "Computer Science",
          rollNumber: null,
          cgpa: null,
          skills: null,
        });
      }

      // Initialize sample jobs if faculty exists
      const faculty = await this.getUserByEmail("faculty@university.edu");
      if (faculty) {
        const existingJobs = await this.getJobsByPostedBy(faculty.id);
        if (existingJobs.length === 0) {
          await this.createJob({
            title: "Software Engineer Intern",
            company: "TechCorp",
            location: "San Francisco, CA",
            type: "internship",
            experience: "0-1 years",
            salary: "$3000/month",
            description: "Join our dynamic team as a Software Engineer Intern and gain hands-on experience in full-stack development.",
            requirements: ["JavaScript", "React", "Node.js"],
            skills: ["JavaScript", "React", "Node.js", "MongoDB"],
            eligibility: "3rd year Computer Science students",
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isActive: true,
          }, faculty.id);

          await this.createJob({
            title: "Full Stack Developer",
            company: "StartupXYZ",
            location: "Remote",
            type: "full-time",
            experience: "1-3 years",
            salary: "$70,000 - $90,000",
            description: "We're looking for a passionate Full Stack Developer to join our growing team.",
            requirements: ["Python", "Django", "React", "PostgreSQL"],
            skills: ["Python", "Django", "React", "PostgreSQL", "AWS"],
            eligibility: "Final year students or recent graduates",
            deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            isActive: true,
          }, faculty.id);
        }
      }
    } catch (error) {
      console.log("Sample data initialization skipped - database might not be ready yet");
    }
  }

  // User operations
  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        password: hashedPassword,
      })
      .returning();
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUsersByDepartment(department: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.department, department));
  }

  // Authentication
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Job operations
  async createJob(job: InsertJob, postedBy: number): Promise<Job> {
    const [newJob] = await db
      .insert(jobs)
      .values({
        ...job,
        postedBy,
      })
      .returning();
    return newJob;
  }

  async getJobs(filters?: { location?: string; type?: string; search?: string }, userId?: number): Promise<JobWithDetails[]> {
    let jobsArray = Array.from(this.jobs.values()).filter(job => job.isActive);
    
    if (filters?.location) {
      jobsArray = jobsArray.filter(job => 
        job.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }
    if (filters?.type) {
      jobsArray = jobsArray.filter(job => job.type === filters.type);
    }
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      jobsArray = jobsArray.filter(job =>
        job.title.toLowerCase().includes(searchTerm) ||
        job.company.toLowerCase().includes(searchTerm) ||
        job.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort by creation date (newest first)
    jobsArray.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // If userId is provided, check saved and applied status
    if (userId) {
      const savedJobIds = new Set(
        Array.from(this.savedJobs.values())
          .filter(sj => sj.studentId === userId)
          .map(sj => sj.jobId)
      );
      
      const appliedJobIds = new Set(
        Array.from(this.applications.values())
          .filter(app => app.studentId === userId)
          .map(app => app.jobId)
      );
      
      return jobsArray.map(job => ({
        ...job,
        savedByUser: savedJobIds.has(job.id),
        appliedByUser: appliedJobIds.has(job.id)
      }));
    }
    
    return jobsArray;
  }

  async getJobById(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async updateJob(id: number, updates: Partial<InsertJob>): Promise<Job> {
    const job = this.jobs.get(id);
    if (!job) throw new Error("Job not found");
    
    const updatedJob: Job = {
      ...job,
      ...updates,
      id: job.id, // Preserve ID
      createdAt: job.createdAt, // Preserve creation date
    };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async deleteJob(id: number): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async getJobsByPostedBy(userId: number): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.postedBy === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const newApplication: Application = {
      id: this.currentApplicationId++,
      ...application,
      resumeId: application.resumeId || null,
      coverLetter: application.coverLetter || null,
      motivation: application.motivation || null,
      status: "pending",
      rejectionReason: null,
      appliedAt: new Date(),
    };
    this.applications.set(newApplication.id, newApplication);
    return newApplication;
  }

  async getApplicationsByStudent(studentId: number): Promise<ApplicationWithDetails[]> {
    return Array.from(this.applications.values())
      .filter(app => app.studentId === studentId)
      .map(app => ({
        ...app,
        job: this.jobs.get(app.jobId),
      }))
      .sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
  }

  async getApplicationsByJob(jobId: number): Promise<ApplicationWithDetails[]> {
    return Array.from(this.applications.values())
      .filter(app => app.jobId === jobId)
      .map(app => ({
        ...app,
        student: this.users.get(app.studentId),
      }))
      .sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
  }

  async updateApplicationStatus(id: number, status: string, rejectionReason?: string): Promise<Application> {
    const application = this.applications.get(id);
    if (!application) throw new Error("Application not found");
    
    const updatedApplication: Application = {
      ...application,
      status,
      rejectionReason: rejectionReason || null,
    };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  async checkExistingApplication(studentId: number, jobId: number): Promise<Application | undefined> {
    return Array.from(this.applications.values()).find(
      app => app.studentId === studentId && app.jobId === jobId
    );
  }

  async getAllApplications(): Promise<ApplicationWithDetails[]> {
    return Array.from(this.applications.values())
      .map(app => ({
        ...app,
        job: this.jobs.get(app.jobId),
        student: this.users.get(app.studentId),
      }))
      .sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
  }

  async createResume(resume: InsertResume): Promise<Resume> {
    const newResume: Resume = {
      id: this.currentResumeId++,
      ...resume,
      isDefault: resume.isDefault || false,
      uploadedAt: new Date(),
    };
    this.resumes.set(newResume.id, newResume);
    return newResume;
  }

  async getResumesByStudent(studentId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values())
      .filter(resume => resume.studentId === studentId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  async deleteResume(id: number, studentId: number): Promise<boolean> {
    const resume = this.resumes.get(id);
    if (!resume || resume.studentId !== studentId) return false;
    return this.resumes.delete(id);
  }

  async setDefaultResume(id: number, studentId: number): Promise<boolean> {
    const resume = this.resumes.get(id);
    if (!resume || resume.studentId !== studentId) return false;
    
    // First, unset all default resumes for this student
    Array.from(this.resumes.values())
      .filter(r => r.studentId === studentId)
      .forEach(r => {
        this.resumes.set(r.id, { ...r, isDefault: false });
      });
    
    // Then set the specified resume as default
    this.resumes.set(id, { ...resume, isDefault: true });
    return true;
  }

  async getResumeById(id: number): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }

  async saveJob(studentId: number, jobId: number): Promise<SavedJob> {
    const savedJob: SavedJob = {
      id: this.currentSavedJobId++,
      studentId,
      jobId,
      savedAt: new Date(),
    };
    this.savedJobs.set(savedJob.id, savedJob);
    return savedJob;
  }

  async unsaveJob(studentId: number, jobId: number): Promise<boolean> {
    const savedJob = Array.from(this.savedJobs.values()).find(
      sj => sj.studentId === studentId && sj.jobId === jobId
    );
    if (!savedJob) return false;
    return this.savedJobs.delete(savedJob.id);
  }

  async getSavedJobs(studentId: number): Promise<JobWithDetails[]> {
    const savedJobIds = Array.from(this.savedJobs.values())
      .filter(sj => sj.studentId === studentId)
      .map(sj => sj.jobId);
    
    return savedJobIds
      .map(jobId => this.jobs.get(jobId))
      .filter((job): job is Job => job !== undefined)
      .map(job => ({
        ...job,
        savedByUser: true,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async checkSavedJob(studentId: number, jobId: number): Promise<boolean> {
    return Array.from(this.savedJobs.values()).some(
      sj => sj.studentId === studentId && sj.jobId === jobId
    );
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      id: this.currentNotificationId++,
      ...notification,
      isRead: false,
      createdAt: new Date(),
    };
    this.notifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markNotificationAsRead(id: number, userId: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification || notification.userId !== userId) return false;
    
    this.notifications.set(id, { ...notification, isRead: true });
    return true;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .length;
  }
}

export const storage = new DatabaseStorage();