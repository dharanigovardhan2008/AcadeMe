import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase";
import { FACULTY_DATA, COURSE_DATA } from "./data";

export const seedDatabase = async () => {
    try {
        const batch = writeBatch(db);

        // 1. Seed Faculty
        console.log("Seeding Faculty...");
        FACULTY_DATA.forEach((faculty) => {
            const facultyRef = doc(collection(db, "faculty")); // Auto-ID
            batch.set(facultyRef, faculty);
        });

        // 2. Seed Courses
        // Structure: collection 'courses', doc = autoId, fields = { branch, name, code }
        console.log("Seeding Courses...");
        Object.entries(COURSE_DATA).forEach(([branch, data]) => {
            // data.courses is the array
            if (data.courses && Array.isArray(data.courses)) {
                data.courses.forEach(course => {
                    const courseRef = doc(collection(db, "courses"));
                    batch.set(courseRef, {
                        branch: branch, // e.g., "CSE"
                        name: course.name,
                        code: course.code,
                        description: data.name // optional, metadata about the branch
                    });
                });
            }
        });

        await batch.commit();
        console.log("Database seeded successfully!");
        alert("Database seeded successfully!");
    } catch (error) {
        console.error("Error seeding database:", error);
        alert("Error seeding database: " + error.message);
    }
};
