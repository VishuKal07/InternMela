-- Create database
CREATE DATABASE IF NOT EXISTS internconnect;
USE internconnect;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    skills TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Internships table
CREATE TABLE IF NOT EXISTS internships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    type ENUM('Remote', 'On-site', 'Hybrid') NOT NULL,
    duration VARCHAR(100) NOT NULL,
    stipend VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT NOT NULL,j
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Internship applications table
CREATE TABLE IF NOT EXISTS internship_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    internship_id INT NOT NULL,
    status ENUM('Applied', 'Pending', 'Approved', 'Rejected') DEFAULT 'Applied',
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (user_id, internship_id)
);

-- Insert sample internships
INSERT INTO internships (title, company, location, type, duration, stipend, description, required_skills) VALUES
('Frontend Developer Intern', 'TechCorp Solutions', 'San Francisco, CA', 'Remote', '3 months', '$3,000/month', 'Join our frontend team to build responsive web applications using React, JavaScript, and modern CSS frameworks.', 'JavaScript,React,HTML,CSS'),
('Data Science Intern', 'DataInsights Inc.', 'New York, NY', 'Hybrid', '6 months', '$4,500/month', 'Work with our data team to analyze large datasets and build predictive models using Python and machine learning libraries.', 'Python,Machine Learning,SQL,Pandas'),
('UX/UI Design Intern', 'CreativeMinds Agency', 'Austin, TX', 'On-site', '4 months', '$2,800/month', 'Design intuitive user interfaces for web and mobile applications. Collaborate with developers to implement designs.', 'Figma,UI/UX Design,Wireframing,Prototyping'),
('Backend Developer Intern', 'ServerStack Technologies', 'Seattle, WA', 'Remote', '5 months', '$3,500/month', 'Develop and maintain server-side applications using Node.js and MongoDB. Implement RESTful APIs and database schemas.', 'Node.js,MongoDB,Express,REST APIs'),
('Marketing Intern', 'GrowthHackers Marketing', 'Chicago, IL', 'Hybrid', '3 months', '$2,500/month', 'Assist in developing marketing campaigns, analyzing performance metrics, and creating content for social media channels.', 'Digital Marketing,Social Media,Content Creation,Analytics'),
('Cybersecurity Intern', 'SecureNet Systems', 'Boston, MA', 'On-site', '6 months', '$4,000/month', 'Learn about network security, vulnerability assessment, and ethical hacking techniques under expert supervision.', 'Network Security,Ethical Hacking,Linux,Python');

-- Insert sample application (for demonstration)
INSERT INTO internship_applications (user_id, internship_id, status, applied_date) VALUES
(1, 1, 'Applied', '2023-10-15'),
(1, 2, 'Pending', '2023-10-20'),
(1, 3, 'Approved', '2023-09-10');