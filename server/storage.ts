import { 
  users, jobs, applications, resumes, savedJobs, notifications,
  type User, type InsertUser, type Job, type InsertJob, 
  type Application, type InsertApplication, type Resume, type InsertResume,
  type SavedJob, type Notification, type InsertNotification,
  type JobWithDetails, type ApplicationWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";
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
  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        password: hashedPassword,
        phone: user.phone || null,
        department: user.department || null,
        cgpa: user.cgpa || null,
        skills: user.skills || null,
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
      .set({
        ...updates,
        phone: updates.phone || null,
        department: updates.department || null,
        cgpa: updates.cgpa || null,
        skills: updates.skills || null,
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUsersByDepartment(department: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.department, department));
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async createJob(job: InsertJob, postedBy: number): Promise<Job> {
    const [newJob] = await db
      .insert(jobs)
      .values({
        ...job,
        postedBy,
        skills: job.skills || null,
        experience: job.experience || null,
        salary: job.salary || null,
        requirements: job.requirements || null,
        isActive: job.isActive !== undefined ? job.isActive : true,
      })
      .returning();
    return newJob;
  }

  async getJobs(filters?: { location?: string; type?: string; search?: string }, userId?: number): Promise<JobWithDetails[]> {
    let whereClause = eq(jobs.isActive, true);
    
    if (filters?.location) {
      whereClause = and(whereClause, ilike(jobs.location, `%${filters.location}%`))!;
    }
    if (filters?.type) {
      whereClause = and(whereClause, eq(jobs.type, filters.type))!;
    }
    if (filters?.search) {
      whereClause = and(
        whereClause,
        or(
          ilike(jobs.title, `%${filters.search}%`),
          ilike(jobs.company, `%${filters.search}%`),
          ilike(jobs.description, `%${filters.search}%`)
        )
      )!;
    }
    
    const jobsResult = await db.select().from(jobs).where(whereClause).orderBy(desc(jobs.createdAt));
    
    // If userId is provided, check saved and applied status
    if (userId) {
      const savedJobsResult = await db.select({ jobId: savedJobs.jobId }).from(savedJobs).where(eq(savedJobs.studentId, userId));
      const savedJobIds = new Set(savedJobsResult.map(sj => sj.jobId));
      
      const appliedJobsResult = await db.select({ jobId: applications.jobId }).from(applications).where(eq(applications.studentId, userId));
      const appliedJobIds = new Set(appliedJobsResult.map(aj => aj.jobId));
      
      return jobsResult.map(job => ({
        ...job,
        savedByUser: savedJobIds.has(job.id),
        appliedByUser: appliedJobIds.has(job.id)
      }));
    }
    
    return jobsResult;
  }

  async getJobById(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async updateJob(id: number, updates: Partial<InsertJob>): Promise<Job> {
    const [updatedJob] = await db
      .update(jobs)
      .set({
        ...updates,
        skills: updates.skills || null,
        experience: updates.experience || null,
        salary: updates.salary || null,
        requirements: updates.requirements || null,
      })
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob;
  }

  async deleteJob(id: number): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getJobsByPostedBy(userId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.postedBy, userId)).orderBy(desc(jobs.createdAt));
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [newApplication] = await db
      .insert(applications)
      .values({
        ...application,
        status: "pending",
        resumeId: application.resumeId || null,
        coverLetter: application.coverLetter || null,
        motivation: application.motivation || null,
        rejectionReason: null,
      })
      .returning();
    return newApplication;
  }

  async getApplicationsByStudent(studentId: number): Promise<ApplicationWithDetails[]> {
    return await db
      .select({
        id: applications.id,
        studentId: applications.studentId,
        jobId: applications.jobId,
        resumeId: applications.resumeId,
        coverLetter: applications.coverLetter,
        motivation: applications.motivation,
        status: applications.status,
        rejectionReason: applications.rejectionReason,
        appliedAt: applications.appliedAt,
        job: jobs,
      })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(applications.studentId, studentId))
      .orderBy(desc(applications.appliedAt));
  }

  async getApplicationsByJob(jobId: number): Promise<ApplicationWithDetails[]> {
    return await db
      .select({
        id: applications.id,
        studentId: applications.studentId,
        jobId: applications.jobId,
        resumeId: applications.resumeId,
        coverLetter: applications.coverLetter,
        motivation: applications.motivation,
        status: applications.status,
        rejectionReason: applications.rejectionReason,
        appliedAt: applications.appliedAt,
        student: users,
      })
      .from(applications)
      .leftJoin(users, eq(applications.studentId, users.id))
      .where(eq(applications.jobId, jobId))
      .orderBy(desc(applications.appliedAt));
  }

  async updateApplicationStatus(id: number, status: string, rejectionReason?: string): Promise<Application> {
    const [updatedApplication] = await db
      .update(applications)
      .set({
        status,
        rejectionReason: rejectionReason || null,
      })
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
    return await db
      .select({
        id: applications.id,
        studentId: applications.studentId,
        jobId: applications.jobId,
        resumeId: applications.resumeId,
        coverLetter: applications.coverLetter,
        motivation: applications.motivation,
        status: applications.status,
        rejectionReason: applications.rejectionReason,
        appliedAt: applications.appliedAt,
        job: jobs,
        student: users,
      })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(users, eq(applications.studentId, users.id))
      .orderBy(desc(applications.appliedAt));
  }

  async createResume(resume: InsertResume): Promise<Resume> {
    const [newResume] = await db
      .insert(resumes)
      .values({
        ...resume,
        isDefault: resume.isDefault || false,
      })
      .returning();
    return newResume;
  }

  async getResumesByStudent(studentId: number): Promise<Resume[]> {
    return await db.select().from(resumes).where(eq(resumes.studentId, studentId)).orderBy(desc(resumes.uploadedAt));
  }

  async deleteResume(id: number, studentId: number): Promise<boolean> {
    const result = await db.delete(resumes).where(and(eq(resumes.id, id), eq(resumes.studentId, studentId)));
    return result.rowCount > 0;
  }

  async setDefaultResume(id: number, studentId: number): Promise<boolean> {
    await db.update(resumes).set({ isDefault: false }).where(eq(resumes.studentId, studentId));
    const result = await db.update(resumes).set({ isDefault: true }).where(and(eq(resumes.id, id), eq(resumes.studentId, studentId)));
    return result.rowCount > 0;
  }

  async getResumeById(id: number): Promise<Resume | undefined> {
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    return resume || undefined;
  }

  async saveJob(studentId: number, jobId: number): Promise<SavedJob> {
    const [savedJob] = await db
      .insert(savedJobs)
      .values({ studentId, jobId })
      .returning();
    return savedJob;
  }

  async unsaveJob(studentId: number, jobId: number): Promise<boolean> {
    const result = await db.delete(savedJobs).where(and(eq(savedJobs.studentId, studentId), eq(savedJobs.jobId, jobId)));
    return result.rowCount > 0;
  }

  async getSavedJobs(studentId: number): Promise<JobWithDetails[]> {
    return await db
      .select({
        id: jobs.id,
        title: jobs.title,
        company: jobs.company,
        location: jobs.location,
        type: jobs.type,
        description: jobs.description,
        experience: jobs.experience,
        salary: jobs.salary,
        skills: jobs.skills,
        deadline: jobs.deadline,
        requirements: jobs.requirements,
        benefits: jobs.benefits,
        isActive: jobs.isActive,
        postedBy: jobs.postedBy,
        createdAt: jobs.createdAt,
        savedByUser: true,
      })
      .from(savedJobs)
      .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
      .where(eq(savedJobs.studentId, studentId))
      .orderBy(desc(savedJobs.createdAt));
  }

  async checkSavedJob(studentId: number, jobId: number): Promise<boolean> {
    const [savedJob] = await db
      .select()
      .from(savedJobs)
      .where(and(eq(savedJobs.studentId, studentId), eq(savedJobs.jobId, jobId)));
    return !!savedJob;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values({
        ...notification,
        isRead: false,
      })
      .returning();
    return newNotification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
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
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.length;
  }
}

export const storage = new DatabaseStorage();