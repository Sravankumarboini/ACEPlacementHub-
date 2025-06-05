import { db } from "./db";
import { users, jobs } from "@shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("Seeding database...");

  // Check if users already exist
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already seeded");
    return;
  }

  // Create sample users
  const student = await db
    .insert(users)
    .values({
      email: "john.smith@college.edu",
      password: await bcrypt.hash("password123", 10),
      firstName: "John",
      lastName: "Smith",
      phone: "+1234567890",
      role: "student",
      department: "Computer Science",
      cgpa: "3.8",
      skills: JSON.stringify(["JavaScript", "Python", "React"]),
    })
    .returning();

  const faculty = await db
    .insert(users)
    .values({
      email: "rajesh.kumar@college.edu",
      password: await bcrypt.hash("password123", 10),
      firstName: "Rajesh",
      lastName: "Kumar",
      phone: "+1234567891",
      role: "faculty",
      department: "Computer Science",
      cgpa: null,
      skills: null,
    })
    .returning();

  // Create sample jobs
  await db
    .insert(jobs)
    .values([
      {
        title: "Senior Software Engineer",
        company: "TechCorp",
        location: "San Francisco, CA",
        type: "Full-time",
        description: "Looking for experienced software engineers to join our growing team.",
        experience: "3-5 years",
        salary: "$120,000 - $150,000",
        skills: ["JavaScript", "React", "Node.js"],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        requirements: "Bachelor's degree in Computer Science or related field",
        benefits: "Health insurance, 401k, flexible work hours",
        isActive: true,
        postedBy: faculty[0].id,
      },
      {
        title: "Frontend Developer Intern",
        company: "StartupXYZ",
        location: "Remote",
        type: "Internship",
        description: "Summer internship opportunity for frontend development.",
        experience: "0-1 years",
        salary: "$20/hour",
        skills: ["HTML", "CSS", "JavaScript"],
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        requirements: "Currently enrolled in Computer Science program",
        benefits: "Mentorship, real-world experience",
        isActive: true,
        postedBy: faculty[0].id,
      },
    ]);

  console.log("Database seeded successfully!");
}

seed().catch(console.error);