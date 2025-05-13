**Detailed Use Cases for Thesis Management Web App**

**Actors:**

* **Student**
* **Lecturer/Supervisor**
* **Moderator**
* **Admin**

---

## **1. User Management**

### 1.1 Admin Creates User Accounts

* **Actor:** Admin
* **Flow:**

  1. Admin creates accounts for students, lecturers, and moderators.
  2. Each account has: name, email, password, role, and assigned semester.

### 1.2 Login / Authentication

* **Actor:** All
* **Flow:**

  1. User logs in with email and password.
  2. System authenticates and redirects based on role.

---

## **2. Semester Management**

### 2.1 Moderator Creates New Semester

* **Actor:** Moderator
* **Flow:**

  1. Moderator defines new semester with year and term.
  2. Assigns lists of students and lecturers.

---

## **3. Pre-Thesis Management**

### 3.1 Supervisor Creates Pre-Thesis Topics

* **Actor:** Lecturer
* **Flow:**

  1. Lecturer defines number of slots per topic.
  2. Adds multiple topics (direction or particular).
  3. For each topic: title, description, slot count, GPA/credit requirement, optional proposal, notes.

### 3.2 Moderator Sets Application Deadline

* **Actor:** Moderator
* **Flow:**

  1. Sets deadline for students to apply/drop pre-thesis topic.

### 3.3 Student Applies for Pre-Thesis Topic

* **Actor:** Student
* **Flow:**

  1. View list of available topics.
  2. Choose topic (with eligibility check).
  3. Optionally customize pre-thesis title.

### 3.4 Student Drops Topic

* **Actor:** Student
* **Flow:**

  1. Before deadline, student drops topic.

### 3.5 Moderator Performs Random Assignment

* **Actor:** Moderator
* **Flow:**

  1. After deadline, students without topics are randomly assigned.

### 3.6 Student Submits Final Report

* **Actor:** Student
* **Flow:**

  1. Uploads report and optional demo.

### 3.7 Supervisor Grades Pre-Thesis

* **Actor:** Lecturer
* **Flow:**

  1. Grades student's report.

### 3.8 Moderator Exports Pre-Thesis Results

* **Actor:** Moderator
* **Flow:**

  1. Generates report with: student, supervisor, topic, demo, grade.

---

## **4. Thesis Management**

### 4.1 Thesis Registration

* **Actor:** Student
* **Flow:**

  1. Either: select previous supervisor or contact new one via email.
  2. Choose fixed topic.

### 4.2 Thesis Eligibility Check

* **Actor:** System + Moderator
* **Flow:**

  1. Check if student has >90% credits or meets exceptions.

### 4.3 Moderator Submits Student-Supervisor Report to Department

* **Actor:** Moderator
* **Flow:**

  1. Generates thesis registration report for department approval.

### 4.4 Reviewer Assignment

* **Actor:** Moderator
* **Flow:**

  1. Assigns reviewer to each student.
  2. Sends assignment info via email.

### 4.5 Review Session Coordination

* **Actor:** Student
* **Flow:**

  1. Student emails reviewer with report, optional slide, and arranges time.

### 4.6 Thesis Grading

* **Actors:** Supervisor, Reviewer, Committee
* **Flow:**

  1. Supervisor and Reviewer each submit grades.
  2. If average >= 50, student proceeds to defense.
  3. Committee grades during defense.

### 4.7 Final Score Calculation

* **Actor:** System
* **Flow:**

  1. Calculate average of all grades.
  2. Final grade = average(supervisor + reviewer + committee).

### 4.8 Export Final Results

* **Actor:** Moderator
* **Flow:**

  1. Generate report with: student, topic, supervisor, reviewer, all scores, final grade.

---

## **5. Announcements**

### 5.1 Supervisor Sends Announcements

* **Actor:** Lecturer
* **Flow:**

  1. Sends announcement to students under their supervision.

---

## **6. Email Integration**

### Notes:

* All communications like topic requests, reviewer meetings, and confirmations are via email.

---

This covers the use cases. If you need Sequelize model structure and ERD (Entity Relationship Diagram), I can build that too!
