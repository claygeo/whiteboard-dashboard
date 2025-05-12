# Whiteboard Project

A React and Electron desktop application designed for batch tracking, integrated with Supabase for robust data storage. Developed as a demo for Curaleaf, this app enables tracking of batch details, calculates takt-time metrics, and provides a dashboard for real-time production monitoring. https://github.com/claygeo/whiteboard-dashboard-visual

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Database Setup](#database-setup)
- [Visuals](#visuals)
- [Notes](#notes)

## Features

- User Authentication: Secure login with line and line lead selection.
- Batch Data Entry: Intuitive dashboard for inputting batch details, including product, packing format, and batch number.
- Data Management: Interactive data table with search, sort, and filter functionalities.
- Real-Time Metrics: Automatic calculation and updating of takt-time metrics for batch performance.
- Supabase Integration: Persistent storage and retrieval of batch data using Supabase.
- Electron Desktop App: Cross-platform desktop application for seamless user experience.

## Prerequisites

Before setting up the project, ensure you have the following:
- Node.js and npm: Install from nodejs.org.
- Supabase Account: Sign up at supabase.com and create a project.
- Environment Variables: Obtain REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY from your Supabase project settings.
- Electron: Required for building and running the desktop app.
- Git: For cloning the repository.

## Setup
Follow these steps to set up the project locally:

1. Clone the Repository:
git clone [your-repo-url]

2. Navigate to the Project Directory:
cd whiteboard-project-frontend

3. Install Dependencies:
npm install

4. Configure Environment Variables:
- Create a .env file in the project root.
- Add the following:
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_KEY=your-supabase-key

5. Run the Development Server:
npm run start:electron

6. Build for Windows:
npm run electron:build

## Database Setup
To configure the Supabase database, you need to create the necessary tables. Copy and paste the following SQL code into the Supabase SQL Editor (found in your Supabase dashboard under SQL Editor). This will set up the tables required for the application.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create batch_data table
CREATE TABLE batch_data (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    actual_units INTEGER,
    batch_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date TIMESTAMP WITHOUT TIME ZONE,
    delta_percentage DOUBLE PRECISION,
    effective_date DATE,
    employee_count INTEGER,
    end_time TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    line TEXT,
    line_lead TEXT,
    line_status VARCHAR DEFAULT 'Open',
    packing_format TEXT,
    product TEXT,
    product_status TEXT,
    running_takt DOUBLE PRECISION,
    shift TEXT,
    start_time TEXT,
    submission_time TEXT,
    takt_time DOUBLE PRECISION,
    target_delta DOUBLE PRECISION,
    target_units INTEGER,
    total_time DOUBLE PRECISION,
    ubi_no TEXT,
    CHECK (id IS NOT NULL)
);

-- Create employee_pace table
CREATE TABLE employee_pace (
    employees INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    percentage DOUBLE PRECISION NOT NULL,
    seconds DOUBLE PRECISION,
    time_reduction DOUBLE PRECISION,
    PRIMARY KEY (employees, created_at, percentage, seconds, time_reduction),
    CHECK (employees IS NOT NULL),
    CHECK (percentage IS NOT NULL)
);

-- Create product_master_list table
CREATE TABLE product_master_list (
    id BIGINT PRIMARY KEY,
    product_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_takt DOUBLE PRECISION,
    delta_percentage DOUBLE PRECISION,
    original_takt DOUBLE PRECISION,
    CHECK (id IS NOT NULL),
    CHECK (product_name IS NOT NULL)
);

-- Create products table
CREATE TABLE products (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_name TEXT UNIQUE,
    packing_format TEXT,
    CHECK (id IS NOT NULL)
);

-- Create weekly_batch_summary table
CREATE TABLE weekly_batch_summary (
    actual_units INTEGER NOT NULL DEFAULT 0,
    CHECK (actual_units IS NOT NULL)
);

## Visuals

Below are screenshots showcasing the application's interface and features.

- Login Screen: ![image](https://github.com/user-attachments/assets/fd2be890-1d49-491b-a6f3-bf023c46729e)
- Dashboard: ![image](https://github.com/user-attachments/assets/e6f2435b-67f1-4555-aba7-073c9a8859d0)
- Data Table: ![image](https://github.com/user-attachments/assets/bf31ba4c-77c2-4975-bc41-8852a82421c2)
- Batch Entry Form: ![image](https://github.com/user-attachments/assets/6c914afa-05bc-4da6-865d-d7a5b80ed5d7)

## Notes

- Curaleaf Branding: Used with permission for demo purposes.
- Line Lead Names: Placeholder names or authorized for public sharing.
- Environment Security: Ensure the .env file is not committed to version control (it’s excluded via .gitignore).
- Supabase Configuration: Verify your Supabase project has the necessary tables and RLS policies before running the app.

