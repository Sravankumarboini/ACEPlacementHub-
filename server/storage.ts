import { 
  users, jobs, applications, resumes, savedJobs, notifications,
  type User, type InsertUser, type Job, type InsertJob, 
  type Application, type InsertApplication, type Resume, type InsertResume,
  type SavedJob, type Notification, type InsertNotification,
  type JobWithDetails, type ApplicationWithDetails
} from "@shared/schema";
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
  getJobs(filters?: { location?: string; type?: string; search?: string }): Promise<JobWithDetails[]>;
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

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private jobs: Map<number, Job> = new Map();
  private applications: Map<number, Application> = new Map();
  private resumes: Map<number, Resume> = new Map();
  private savedJobs: Map<number, SavedJob> = new Map();
  private notifications: Map<number, Notification> = new Map();
  
  private currentUserId = 1;
  private currentJobId = 1;
  private currentApplicationId = 1;
  private currentResumeId = 1;
  private currentSavedJobId = 1;
  private currentNotificationId = 1;

  constructor() {
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample users
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    // Sample student
    const student: User = {
      id: this.currentUserId++,
      email: "john.smith@college.edu",
      password: hashedPassword,
      firstName: "John",
      lastName: "Smith",
      phone: "+91 9876543210",
      role: "student",
      department: "Computer Science",
      cgpa: "8.5",
      skills: ["React", "Node.js", "Python", "JavaScript", "SQL", "Git"],
      createdAt: new Date(),
    };
    this.users.set(student.id, student);

    // Sample faculty
    const faculty: User = {
      id: this.currentUserId++,
      email: "rajesh.kumar@college.edu",
      password: hashedPassword,
      firstName: "Rajesh",
      lastName: "Kumar",
      phone: "+91 9876543211",
      role: "faculty",
      department: "Computer Science",
      cgpa: null,
      skills: null,
      createdAt: new Date(),
    };
    this.users.set(faculty.id, faculty);

    // Sample jobs
    const job1: Job = {
      id: this.currentJobId++,
      title: "Senior Software Engineer",
      company: "TechCorp Solutions",
      location: "Bangalore, India",
      type: "full-time",
      experience: "3-5 years",
      salary: "12-18 LPA",
      description: "We are looking for a Senior Software Engineer to join our dynamic team. You will be responsible for developing scalable web applications...",
      requirements: ["Bachelor's degree in Computer Science", "3+ years of experience"],
      skills: ["React", "Node.js", "Python", "PostgreSQL"],
      eligibility: "CGPA >= 7.5",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isActive: true,
      postedBy: faculty.id,
      createdAt: new Date(),
    };
    this.jobs.set(job1.id, job1);

    const job2: Job = {
      id: this.currentJobId++,
      title: "Frontend Developer Intern",
      company: "StartupXYZ",
      location: "Mumbai, India",
      type: "internship",
      experience: "0-1 years",
      salary: "25K/month",
      description: "Great opportunity for students to gain hands-on experience in frontend development. Work with modern technologies and learn from experienced developers...",
      requirements: ["Basic knowledge of web technologies", "Eagerness to learn"],
      skills: ["HTML/CSS", "JavaScript", "React"],
      eligibility: "Currently pursuing Computer Science degree",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      isActive: true,
      postedBy: faculty.id,
      createdAt: new Date(),
    };
    this.jobs.set(job2.id, job2);
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser: User = {
      ...user,
      id: this.currentUserId++,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsersByDepartment(department: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.department === department && user.role === "student"
    );
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async createJob(job: InsertJob, postedBy: number): Promise<Job> {
    const newJob: Job = {
      ...job,
      id: this.currentJobId++,
      postedBy,
      createdAt: new Date(),
    };
    this.jobs.set(newJob.id, newJob);
    return newJob;
  }

  async getJobs(filters?: { location?: string; type?: string; search?: string }): Promise<JobWithDetails[]> {
    let jobs = Array.from(this.jobs.values()).filter(job => 
      job.isActive && new Date(job.deadline) > new Date()
    );

    if (filters?.location && filters.location !== "All Locations") {
      jobs = jobs.filter(job => job.location.includes(filters.location!));
    }

    if (filters?.type && filters.type !== "All Types") {
      jobs = jobs.filter(job => job.type === filters.type);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      jobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower)
      );
    }

    return jobs.map(job => ({
      ...job,
      applications: Array.from(this.applications.values()).filter(app => app.jobId === job.id),
    }));
  }

  async getJobById(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async updateJob(id: number, updates: Partial<InsertJob>): Promise<Job> {
    const job = this.jobs.get(id);
    if (!job) throw new Error("Job not found");
    
    const updatedJob = { ...job, ...updates };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async deleteJob(id: number): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async getJobsByPostedBy(userId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.postedBy === userId);
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const newApplication: Application = {
      ...application,
      id: this.currentApplicationId++,
      status: "pending",
      appliedAt: new Date(),
    };
    this.applications.set(newApplication.id, newApplication);
    return newApplication;
  }

  async getApplicationsByStudent(studentId: number): Promise<ApplicationWithDetails[]> {
    const applications = Array.from(this.applications.values()).filter(
      app => app.studentId === studentId
    );

    return applications.map(app => ({
      ...app,
      job: this.jobs.get(app.jobId),
      resume: app.resumeId ? this.resumes.get(app.resumeId) : undefined,
    }));
  }

  async getApplicationsByJob(jobId: number): Promise<ApplicationWithDetails[]> {
    const applications = Array.from(this.applications.values()).filter(
      app => app.jobId === jobId
    );

    return applications.map(app => ({
      ...app,
      student: this.users.get(app.studentId),
      resume: app.resumeId ? this.resumes.get(app.resumeId) : undefined,
    }));
  }

  async updateApplicationStatus(id: number, status: string, rejectionReason?: string): Promise<Application> {
    const application = this.applications.get(id);
    if (!application) throw new Error("Application not found");
    
    const updatedApplication = { 
      ...application, 
      status, 
      rejectionReason: rejectionReason || application.rejectionReason 
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
    const applications = Array.from(this.applications.values());

    return applications.map(app => ({
      ...app,
      job: this.jobs.get(app.jobId),
      student: this.users.get(app.studentId),
      resume: app.resumeId ? this.resumes.get(app.resumeId) : undefined,
    }));
  }

  async createResume(resume: InsertResume): Promise<Resume> {
    const newResume: Resume = {
      ...resume,
      id: this.currentResumeId++,
      uploadedAt: new Date(),
    };
    this.resumes.set(newResume.id, newResume);
    return newResume;
  }

  async getResumesByStudent(studentId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values()).filter(resume => resume.studentId === studentId);
  }

  async deleteResume(id: number, studentId: number): Promise<boolean> {
    const resume = this.resumes.get(id);
    if (!resume || resume.studentId !== studentId) return false;
    return this.resumes.delete(id);
  }

  async setDefaultResume(id: number, studentId: number): Promise<boolean> {
    const resume = this.resumes.get(id);
    if (!resume || resume.studentId !== studentId) return false;

    // Remove default from all other resumes
    Array.from(this.resumes.values())
      .filter(r => r.studentId === studentId)
      .forEach(r => {
        this.resumes.set(r.id, { ...r, isDefault: false });
      });

    // Set this resume as default
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
    const savedJobEntries = Array.from(this.savedJobs.values()).filter(
      sj => sj.studentId === studentId
    );

    return savedJobEntries.map(savedJob => {
      const job = this.jobs.get(savedJob.jobId);
      return job ? {
        ...job,
        savedByUser: true,
        applications: Array.from(this.applications.values()).filter(app => app.jobId === job.id),
      } : null;
    }).filter(Boolean) as JobWithDetails[];
  }

  async checkSavedJob(studentId: number, jobId: number): Promise<boolean> {
    return Array.from(this.savedJobs.values()).some(
      sj => sj.studentId === studentId && sj.jobId === jobId
    );
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: this.currentNotificationId++,
      createdAt: new Date(),
    };
    this.notifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notif => notif.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markNotificationAsRead(id: number, userId: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification || notification.userId !== userId) return false;
    
    this.notifications.set(id, { ...notification, isRead: true });
    return true;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values()).filter(
      notif => notif.userId === userId && !notif.isRead
    ).length;
  }
}

export const storage = new MemStorage();
