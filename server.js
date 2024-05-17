const inquirer = require('inquirer');
const { table } = require('table');
const { createUpdateOptions, initialQuestion, departmentQuestions, roleQuestions, employeeQuestions } = require('./lib/questions');
const db = require('./config/connections');

startApp();

function displayDepartments() {
    db.query('SELECT id, dptname AS name FROM departments', (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return;
        }
        
        const departmentTable = [['Department ID', 'Department Name']];
        results.forEach(dept => {
            departmentTable.push([dept.id, dept.name]);
        });

        console.log('\n' + table(departmentTable));
        startApp();
    });
}

function addNewDepartment() {
    inquirer.prompt(departmentQuestions).then(data => {
        db.query('INSERT INTO departments (dptname) VALUES (?)', [data.dptname], (err, results) => {
            if (err) {
                console.error('Error adding department:', err);
                return;
            }

            console.log('Department added successfully.');
            startApp();
        });
    });
}

function displayRoles() {
    const query = `
        SELECT roles.id, roles.title, roles.salary, departments.dptname AS department 
        FROM roles 
        JOIN departments ON roles.department_id = departments.id`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return;
        }
        
        const roleTable = [['Role ID', 'Title', 'Salary', 'Department']];
        results.forEach(role => {
            roleTable.push([role.id, role.title, role.salary, role.department]);
        });

        console.log('\n' + table(roleTable));
        startApp();
    });
}

function addRole() {
    inquirer.prompt(roleQuestions).then(data => {
        db.query('SELECT id, dptname FROM departments', (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                return;
            }

            const departmentChoices = results.map(dept => `${dept.id}: ${dept.dptname}`);
            inquirer.prompt({
                type: 'list',
                name: 'departmentId',
                message: 'Select a department for the new role:',
                choices: departmentChoices
            }).then(selection => {
                const deptId = selection.departmentId.split(':')[0];
                db.query('INSERT INTO roles (title, salary, department_id) VALUES (?, ?, ?)', 
                [data.title, data.salary, deptId], (err, results) => {
                    if (err) {
                        console.error('Error adding role:', err);
                        return;
                    }

                    console.log('Role added successfully.');
                    startApp();
                });
            });
        });
    });
}

function displayEmployees() {
    const query = `
        SELECT employees.id, CONCAT(employees.first_name, ' ', employees.last_name) AS name, 
               roles.title, roles.salary, departments.dptname AS department, 
               CONCAT(managers.first_name, ' ', managers.last_name) AS manager 
        FROM employees 
        JOIN roles ON employees.role_id = roles.id 
        JOIN departments ON roles.department_id = departments.id 
        LEFT JOIN employees AS managers ON employees.manager_id = managers.id`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return;
        }
        
        const employeeTable = [['Employee ID', 'Name', 'Title', 'Salary', 'Department', 'Manager']];
        results.forEach(emp => {
            employeeTable.push([emp.id, emp.name, emp.title, emp.salary, emp.department, emp.manager]);
        });

        console.log('\n' + table(employeeTable));
        startApp();
    });
}

function addEmployee() {
    inquirer.prompt(employeeQuestions).then(data => {
        db.query('SELECT id, title FROM roles', (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                return;
            }

            const roleChoices = results.map(role => role.title);
            inquirer.prompt({
                type: 'list',
                name: 'roleTitle',
                message: 'Select a role for the new employee:',
                choices: roleChoices
            }).then(selection => {
                const role = results.find(r => r.title === selection.roleTitle);
                db.query('SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employees', (err, managerResults) => {
                    if (err) {
                        console.error('Error executing query:', err);
                        return;
                    }

                    const managerChoices = managerResults.map(mgr => mgr.name);
                    managerChoices.push('No Manager');
                    inquirer.prompt({
                        type: 'list',
                        name: 'managerName',
                        message: 'Select a manager for the new employee or "No Manager":',
                        choices: managerChoices
                    }).then(managerSelection => {
                        const manager = managerResults.find(mgr => mgr.name === managerSelection.managerName);
                        const managerId = manager ? manager.id : null;
                        db.query('INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)', 
                        [data.firstName, data.lastName, role.id, managerId], (err, results) => {
                            if (err) {
                                console.error('Error adding employee:', err);
                                return;
                            }

                            console.log('Employee added successfully.');
                            startApp();
                        });
                    });
                });
            });
        });
    });
}

function updateEmployee() {
    const query = `
        SELECT employees.id, CONCAT(employees.first_name, ' ', employees.last_name) AS name, roles.title 
        FROM employees 
        JOIN roles ON employees.role_id = roles.id`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return;
        }

        const employeeChoices = results.map(emp => `${emp.id}: ${emp.name}`);
        inquirer.prompt({
            type: 'list',
            name: 'selectedEmployee',
            message: 'Which employee do you want to update?',
            choices: employeeChoices
        }).then(selection => {
            const [empId, empName] = selection.selectedEmployee.split(': ');
            const employee = results.find(emp => emp.id == empId);
            updateEmployeeDetails(empId, employee.title);
        });
    });
}

function updateEmployeeDetails(empId, currentTitle) {
    inquirer.prompt(createUpdateOptions).then(choice => {
        switch (choice.updateChoice) {
            case 'Update Name':
                updateEmployeeName(empId);
                break;
            case 'Update Role':
                updateEmployeeRole(empId);
                break;
            case 'Update Manager':
                updateEmployeeManager(empId, currentTitle);
                break;
            case 'Exit':
                startApp();
                break;
        }
    });
}

function updateEmployeeName(empId) {
    inquirer.prompt(employeeQuestions).then(data => {
        db.query('UPDATE employees SET first_name = ?, last_name = ? WHERE id = ?', 
        [data.firstName, data.lastName, empId], (err, results) => {
            if (err) {
                console.error('Error updating name:', err);
                return;
            }

            console.log('Employee name updated successfully.');
            startApp();
        });
    });
}

function updateEmployeeRole(empId) {
    db.query('SELECT id, title FROM roles', (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return;
        }

        const roleChoices = results.map(role => role.title);
        inquirer.prompt({
            type: 'list',
            name: 'newRoleTitle',
            message: 'Select the new role for the employee:',
            choices: roleChoices
        }).then(selection => {
            const role = results.find(r => r.title === selection.newRoleTitle);
            db.query('UPDATE employees SET role_id = ? WHERE id = ?', 
            [role.id, empId], (err, results) => {
                if (err) {
                    console.error('Error updating role:', err);
                    return;
                }

                console.log('Employee role updated successfully.');
                startApp();
            });
        });
    });
}

function updateEmployeeManager(empId, currentTitle) {
    db.query('SELECT id FROM roles WHERE title = ?', [currentTitle], (err, roleResults) => {
        if (err) {
            console.error('Error fetching role ID:', err);
            return;
        }

        const departmentId = roleResults[0].id;
        db.query('SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employees WHERE role_id = ?', 
        [departmentId], (err, results) => {
            if (err) {
                console.error('Error fetching employees:', err);
                return;
            }

            const managerChoices = results.map(emp => emp.name);
            managerChoices.push('No Manager');
            inquirer.prompt({
                type: 'list',
                name: 'newManagerName',
                message: 'Select the new manager for the employee or "No Manager":',
                choices: managerChoices
            }).then(selection => {
                const manager = results.find(emp => emp.name === selection.newManagerName);
                const managerId = manager ? manager.id : null;
                db.query('UPDATE employees SET manager_id = ? WHERE id = ?', 
                [managerId, empId], (err, results) => {
                    if (err) {
                        console.error('Error updating manager:', err);
                        return;
                    }

                    console.log('Employee manager updated successfully.');
                    startApp();
                });
            });
        });
    });
}

function startApp() {
    console.log('Starting application...'); // Log that the application is starting
    inquirer.prompt(initialQuestion).then(response => {
        console.log('User action:', response.action); // Log the user's action
        switch (response.action) {
            case 'View all departments':
                console.log('Viewing all departments...'); // Log that the user is viewing all departments
                displayDepartments();
                break;
            case 'View all roles':
                console.log('Viewing all roles...'); // Log that the user is viewing all roles
                displayRoles();
                break;
            case 'View all employees':
                console.log('Viewing all employees...'); // Log that the user is viewing all employees
                displayEmployees();
                break;
            case 'Add a department':
                console.log('Adding a department...'); // Log that the user is adding a department
                addNewDepartment();
                break;
            case 'Add a role':
                console.log('Adding a role...'); // Log that the user is adding a role
                addRole();
                break;
            case 'Add an employee':
                console.log('Adding an employee...'); // Log that the user is adding an employee
                addEmployee();
                break;
            case 'Update an employee':
                console.log('Updating an employee...'); // Log that the user is updating an employee
                updateEmployee();
                break;
            case 'Exit':
                console.log('Exiting application...'); // Log that the user is exiting the application
                db.end();
                break;
            default:
                console.log('Invalid choice, please try again.'); // Log that the user made an invalid choice
                startApp();
                break;
        }
    });
}