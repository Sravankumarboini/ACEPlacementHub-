import { 
  users, jobs, applications, resumes, savedJobs, notifications,
  type User, type InsertUser, type Job, type InsertJob, 
  type Application, type InsertApplication, type Resume, type InsertResume,
  type SavedJob, type Notification, type InsertNotification,
  type JobWithDetails, type ApplicationWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, ilike, or, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";
import { elasticsearchService } from "./elasticsearch";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  getUsersByDepartment(department: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  
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
    // Initialize sample data in background
    setTimeout(() => this.initializeSampleData(), 1000);
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
        const faculty = await this.createUser({
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

        // Create sample jobs
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
    } catch (error) {
      console.log("Sample data initialization completed or skipped");
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
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
    let query = db.select().from(jobs);

    // Apply filters
    if (filters?.location) {
      query = query.where(ilike(jobs.location, `%${filters.location}%`));
    }
    if (filters?.type) {
      query = query.where(eq(jobs.type, filters.type));
    }
    if (filters?.search) {
      query = query.where(
        or(
          ilike(jobs.title, `%${filters.search}%`),
          ilike(jobs.company, `%${filters.search}%`),
          ilike(jobs.description, `%${filters.search}%`)
        )
      );
    }

    const jobResults = await query.orderBy(desc(jobs.createdAt));

    // Enhance with user-specific data if userId provided
    if (userId) {
      const jobsWithDetails: JobWithDetails[] = [];
      for (const job of jobResults) {
        // Check if saved by user
        const [savedJob] = await db
          .select()
          .from(savedJobs)
          .where(and(eq(savedJobs.studentId, userId), eq(savedJobs.jobId, job.id)));

        // Check if applied by user
        const [application] = await db
          .select()
          .from(applications)
          .where(and(eq(applications.studentId, userId), eq(applications.jobId, job.id)));

        jobsWithDetails.push({
          ...job,
          savedByUser: !!savedJob,
          appliedByUser: !!application,
        });
      }
      return jobsWithDetails;
    }

    return jobResults.map(job => ({ ...job, savedByUser: false, appliedByUser: false }));
  }

  async getJobById(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async updateJob(id: number, updates: Partial<InsertJob>): Promise<Job> {
    const [updatedJob] = await db
      .update(jobs)
      .set(updates)
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob;
  }

  async deleteJob(id: number): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return result.rowCount > 0;
  }

  async getJobsByPostedBy(userId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.postedBy, userId)).orderBy(desc(jobs.createdAt));
  }

  // Application operations
  async createApplication(application: InsertApplication): Promise<Application> {
    const [newApplication] = await db
      .insert(applications)
      .values(application)
      .returning();
    return newApplication;
  }

  async getApplicationsByStudent(studentId: number): Promise<ApplicationWithDetails[]> {
    const results = await db
      .select({
        application: applications,
        job: jobs,
        resume: resumes,
      })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(resumes, eq(applications.resumeId, resumes.id))
      .where(eq(applications.studentId, studentId))
      .orderBy(desc(applications.appliedAt));

    return results.map(result => ({
      ...result.application,
      job: result.job,
      resume: result.resume,
    }));
  }

  async getApplicationsByJob(jobId: number): Promise<ApplicationWithDetails[]> {
    const results = await db
      .select({
        application: applications,
        student: users,
        resume: resumes,
      })
      .from(applications)
      .leftJoin(users, eq(applications.studentId, users.id))
      .leftJoin(resumes, eq(applications.resumeId, resumes.id))
      .where(eq(applications.jobId, jobId))
      .orderBy(desc(applications.appliedAt));

    return results.map(result => ({
      ...result.application,
      student: result.student,
      resume: result.resume,
    }));
  }

  async updateApplicationStatus(id: number, status: string, rejectionReason?: string): Promise<Application> {
    const [updatedApplication] = await db
      .update(applications)
      .set({ status, rejectionReason })
      .where(eq(applications.id, id))
      .returning();
    return updatedApplication;
  }

  async checkExistingApplication(studentId: number, jobId: number): Promise<Application | undefined> {
    const [application] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.studentId, studentId), eq(applications.jobId, jobId)));
    return application || undefined;
  }

  async getAllApplications(): Promise<ApplicationWithDetails[]> {
    const results = await db
      .select({
        application: applications,
        job: jobs,
        student: users,
        resume: resumes,
      })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(users, eq(applications.studentId, users.id))
      .leftJoin(resumes, eq(applications.resumeId, resumes.id))
      .orderBy(desc(applications.appliedAt));

    return results.map(result => ({
      ...result.application,
      job: result.job,
      student: result.student,
      resume: result.resume,
    }));
  }

  // Resume operations
  async createResume(resume: InsertResume): Promise<Resume> {
    const [newResume] = await db
      .insert(resumes)
      .values(resume)
      .returning();
    return newResume;
  }

  async getResumesByStudent(studentId: number): Promise<Resume[]> {
    return await db.select().from(resumes).where(eq(resumes.studentId, studentId)).orderBy(desc(resumes.uploadedAt));
  }

  async deleteResume(id: number, studentId: number): Promise<boolean> {
    const result = await db
      .delete(resumes)
      .where(and(eq(resumes.id, id), eq(resumes.studentId, studentId)));
    return result.rowCount > 0;
  }

  async setDefaultResume(id: number, studentId: number): Promise<boolean> {
    // First, unset all default resumes for this student
    await db
      .update(resumes)
      .set({ isDefault: false })
      .where(eq(resumes.studentId, studentId));

    // Then set the specified resume as default
    const result = await db
      .update(resumes)
      .set({ isDefault: true })
      .where(and(eq(resumes.id, id), eq(resumes.studentId, studentId)));

    return result.rowCount > 0;
  }

  async getResumeById(id: number): Promise<Resume | undefined> {
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    return resume || undefined;
  }

  // Saved jobs operations
  async saveJob(studentId: number, jobId: number): Promise<SavedJob> {
    const [savedJob] = await db
      .insert(savedJobs)
      .values({ studentId, jobId })
      .returning();
    return savedJob;
  }

  async unsaveJob(studentId: number, jobId: number): Promise<boolean> {
    const result = await db
      .delete(savedJobs)
      .where(and(eq(savedJobs.studentId, studentId), eq(savedJobs.jobId, jobId)));
    return result.rowCount > 0;
  }

  async getSavedJobs(studentId: number): Promise<JobWithDetails[]> {
    const results = await db
      .select({
        job: jobs,
      })
      .from(savedJobs)
      .leftJoin(jobs, eq(savedJobs.jobId, jobs.id))
      .where(eq(savedJobs.studentId, studentId))
      .orderBy(desc(savedJobs.savedAt));

    return results.map(result => ({
      ...result.job!,
      savedByUser: true,
      appliedByUser: false, // Will be updated separately if needed
    }));
  }

  async checkSavedJob(studentId: number, jobId: number): Promise<boolean> {
    const [savedJob] = await db
      .select()
      .from(savedJobs)
      .where(and(eq(savedJobs.studentId, studentId), eq(savedJobs.jobId, jobId)));
    return !!savedJob;
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number, userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    return result.rowCount > 0;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.length;
  }
}

export const storage = new DatabaseStorage();