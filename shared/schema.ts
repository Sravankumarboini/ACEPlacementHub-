import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull(), // 'student' | 'faculty'
  department: text("department"),
  cgpa: text("cgpa"),
  skills: text("skills").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  type: text("type").notNull(), // 'full-time' | 'internship' | 'part-time'
  experience: text("experience"),
  salary: text("salary"),
  description: text("description").notNull(),
  requirements: text("requirements").array(),
  skills: text("skills").array(),
  eligibility: text("eligibility"),
  deadline: timestamp("deadline").notNull(),
  isActive: boolean("is_active").default(true),
  postedBy: integer("posted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  resumeId: integer("resume_id").references(() => resumes.id),
  coverLetter: text("cover_letter"),
  motivation: text("motivation"),
  status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'rejected'
  rejectionReason: text("rejection_reason"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  isDefault: boolean("is_default").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const savedJobs = pgTable("saved_jobs", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'job_alert' | 'application_update' | 'general'
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  postedBy: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  appliedAt: true,
  status: true,
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  uploadedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type SavedJob = typeof savedJobs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Additional types for API responses
export type JobWithDetails = Job & {
  applications?: Application[];
  savedByUser?: boolean;
  appliedByUser?: boolean;
};

export type ApplicationWithDetails = Application & {
  job?: Job;
  student?: User;
  resume?: Resume;
};

export type UserWithStats = User & {
  applicationCount?: number;
  savedJobsCount?: number;
  resumeCount?: number;
};
