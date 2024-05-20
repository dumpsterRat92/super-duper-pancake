# Employee Tracker

Employee Tracker is a Node.js application for managing departments, roles, and employees within an organization. It provides a command-line interface (CLI) for performing various actions such as viewing, adding, updating, and deleting department, role, and employee records in a MySQL database.

## Video Demo

[Link Text](URL)

## Features

- View all departments, roles, and employees
- Add new departments, roles, and employees
- Update existing employee details including name, role, and manager
- Interactive command-line interface with Inquirer.js for user interaction
- Error handling and logging for better application stability

## Prerequisites

Before running the application, ensure you have the following installed:

- Node.js
- MySQL database

## Installation

1. Clone the repository:

   ```bash
   git clone <repository_url>
Navigate to the project directory:

cd employeetracker

3. Install dependencies:

npm install

4. Configure MySQL database connection:

-Create a '.env' file in the root directory
-Add your MySQL database connection details:

DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name

5. Initialize the database:

Run the provided SQL script (schema.sql) to create the necessary database schema and tables.

6. Start the application:

node server.js

## Usage

Follow the on-screen prompts to navigate through the application and perform various actions such as viewing, adding, updating, and deleting records.

## Contributing

Contributions are welcome! If you find any bugs or have suggestions for improvement, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.

