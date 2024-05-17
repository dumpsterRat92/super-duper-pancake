USE employees_db;

INSERT INTO departments (id, dptname) VALUES
(10, 'Human Resources'),
(20, 'Accounting'),
(30, 'Information Technology');

INSERT INTO roles (id, title, salary, department_id) VALUES
(100, 'HR Director', 75000, 10),
(200, 'HR Coordinator', 45000, 10),
(300, 'Senior Accountant', 62000, 20),
(400, 'Financial Consultant', 68000, 20),
(500, 'Lead Developer', 82000, 30),
(600, 'Systems Administrator', 77000, 30);

INSERT INTO employees (id, first_name, last_name, role_id, manager_id) VALUES
(1000, 'Alice', 'Walker', 100, NULL),
(2000, 'Bob', 'Morris', 200, 1000),
(3000, 'Carol', 'Evans', 300, NULL),
(4000, 'Dan', 'Miller', 400, 3000),
(5000, 'Eve', 'Campbell', 500, NULL),
(6000, 'Frank', 'Adams', 600, 5000);