-- Create the database
CREATE DATABASE IF NOT EXISTS discord_bot_questions;
USE discord_bot_questions;

-- Create the questions table
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT NOT NULL,
    answers JSON NOT NULL,
    correct_answers JSON NOT NULL,
    day DATE NOT NULL UNIQUE
);

-- Create the user_answers table
CREATE TABLE IF NOT EXISTS user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    question_id INT NOT NULL,
    answers JSON NOT NULL,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id),
    UNIQUE KEY user_question (user_id, question_id)
);

-- Create the scoreboard table
CREATE TABLE IF NOT EXISTS scoreboard (
    user_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    score FLOAT DEFAULT 0,
    UNIQUE KEY unique_user (user_id)
);

-- Insert some sample questions
INSERT INTO questions (question_text, answers, correct_answers, day) VALUES
('What is the capital of France?', '["Paris", "London", "Berlin", "Madrid"]', '["Paris"]', CURDATE()),
('Which of these are primary colors?', '["Red", "Green", "Blue", "Yellow"]', '["Red", "Blue", "Yellow"]', DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
('Which planets in our solar system have rings?', '["Jupiter", "Saturn", "Uranus", "Neptune"]', '["Jupiter", "Saturn", "Uranus", "Neptune"]', DATE_ADD(CURDATE(), INTERVAL 2 DAY));