const inquirer = require('inquirer');
const { table } = require('table');
const { makeUpdate, question1, addDept, addRole: addRoleQuestions, addEmp } = require('./lib/questions');
const db = require('./config/connections');

startApp();

function logErrorAndContinue(err, context) {
    console.error(`Error in ${context}:`, err);
    startApp();
}

async function queryDB(query, params = []) {
    return new Promise((resolve, reject) => {
        db.query(query, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

async function displayDepartments() {
    try {
        const results = await queryDB('SELECT id, dptname AS name FROM departments');
        const departmentTable = [['Department ID', 'Department Name'], ...results.map(dept => [dept.id, dept.name])];
        console.log('\n' + table(departmentTable));
        startApp();
    } catch (err) {
        logErrorAndContinue(err, 'displayDepartments');
    }
}

async function addNewDepartment() {
    try {
        const data = await inquirer.prompt(addDept);
        await queryDB('INSERT INTO departments (dptname) VALUES (?)', [data.dptname]);
        console.log('Department added successfully.');
        startApp();
    } catch (err) {
        logErrorAndContinue(err, 'addNewDepartment');
    }
}

async function displayRoles() {
    const query = `
        SELECT roles.id, roles.title, roles.salary, departments.dptname AS department 
        FROM roles 
        JOIN departments ON roles.department_id = departments.id`;
    try {
        const results = await queryDB(query);
        const roleTable = [['Role ID', 'Title', 'Salary', 'Department'], ...results.map(role => [role.id, role.title, role.salary, role.department])];
        console.log('\n' + table(roleTable));
        startApp();
    } catch (err) {
        logErrorAndContinue(err, 'displayRoles');
    }
}

async function addRole() {
    try {
        const data = await inquirer.prompt(addRole);
        const departments = await queryDB('SELECT id, dptname FROM departments');
        const departmentChoices = departments.map(dept => `${dept.id}: ${dept.dptname}`);
        const selection = await inquirer.prompt({
            type: 'list',
            name: 'departmentId',
            message: 'Select a department for the new role:',
            choices: departmentChoices
        });
        const deptId = selection.departmentId.split(':')[0];
        await queryDB('INSERT INTO roles (title, salary, department_id) VALUES (?, ?, ?)', [data.title, data.salary, deptId]);
        console.log('Role added successfully.');
        startApp();
    } catch (err) {
        logErrorAndContinue(err, 'addRole');
    }
}

async function displayEmployees() {
    const query = `
        SELECT employees.id, CONCAT(employees.first_name, ' ', employees.last_name) AS name, 
               roles.title, roles.salary, departments.dptname AS department, 
               CONCAT(managers.first_name, ' ', managers.last_name) AS manager 
        FROM employees 
        JOIN roles ON employees.role_id = roles.id 
        JOIN departments ON roles.department_id = departments.id 
        LEFT JOIN employees AS managers ON employees.manager_id = managers.id`;
    try {
        const results = await queryDB(query);
        const employeeTable = [['Employee ID', 'Name', 'Title', 'Salary', 'Department', 'Manager'], ...results.map(emp => [emp.id, emp.name, emp.title, emp.salary, emp.department, emp.manager])];
        console.log('\n' + table(employeeTable));
        startApp();
    } catch (err) {
        logErrorAndContinue(err, 'displayEmployees');
    }
}

async function addEmployee() {
    try {
        const data = await inquirer.prompt(addEmp);
        const roles = await queryDB('SELECT id, title FROM roles');
        const roleChoices = roles.map(role => role.title);
        const roleSelection = await inquirer.prompt({
            type: 'list',
            name: 'roleTitle',
            message: 'Select a role for the new employee:',
            choices: roleChoices
        });
        const role = roles.find(r => r.title === roleSelection.roleTitle);
        const employees = await queryDB('SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employees');
        const managerChoices = employees.map(mgr => mgr.name);
        managerChoices.push('No Manager');
        const managerSelection = await inquirer.prompt({
            type: 'list',
            name: 'managerName',
            message: 'Select a manager for the new employee or "No Manager":',
            choices: managerChoices
        });
        const manager = employees.find(mgr => mgr.name === managerSelection.managerName);
        const managerId = manager ? manager.id : null;
        await queryDB('INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)', [data.firstname, data.lastname, role.id, managerId]);
        console.log('Employee added successfully.');
        startApp();
    } catch (err) {
        logErrorAndContinue(err, 'addEmployee');
    }
}

async function updateEmployee() {
    const query = `
        SELECT employees.id, CONCAT(employees.first_name, ' ', employees.last_name) AS name, roles.title 
        FROM employees 
        JOIN roles ON employees.role_id = roles.id`;
    try {
        const results = await queryDB(query);
        const employeeChoices = results.map(emp => `${emp.id}: ${emp.name}`);
        const selection = await inquirer.prompt({
            type: 'list',
            name: 'selectedEmployee',
            message: 'Which employee do you want to update?',
            choices: employeeChoices
        });
        const [empId] = selection.selectedEmployee.split(': ');
        const employee = results.find(emp => emp.id == empId);
        updateEmployeeDetails(empId, employee.title);
    } catch (err) {
        logErrorAndContinue(err, 'updateEmployee');
    }
}

async function updateEmployeeDetails(empId, currentTitle) {
    try {
        const choice = await inquirer.prompt(makeUpdate);
        switch (choice.which) {
            case 'Name':
                updateEmployeeName(empId);
                break;
            case 'Role':
                updateEmployeeRole(empId);
                break;
            case 'Manager':
                updateEmployeeManager(empId, currentTitle);
                break;
            case 'Quit':
                startApp();
                break;
        }
    } catch (err) {
        logErrorAndContinue(err, 'updateEmployeeDetails');
    }
}

async function updateEmployeeName(empId) {
    try {
        const data = await inquirer.prompt(addEmp);
        await queryDB('UPDATE employees SET first_name = ?, last_name = ? WHERE id = ?', [data.firstname, data.lastname, empId]);
        console.log('Employee name updated successfully.');
        startApp();
    } catch (err) {
        logErrorAndContinue(err, 'updateEmployeeName');
    }
}

async function updateEmployeeRole(empId) {
    try {
        const roles = await queryDB('SELECT id, title FROM roles');
        const roleChoices = roles.map(role => role.title);
        const selection = await inquirer.prompt({
            type: 'list',
            name: 'newRoleTitle',
            message: 'Select the new role for the employee:',
            choices: roleChoices
        });
        const role = roles.find(r => r.title === selection.newRoleTitle);
        await queryDB('UPDATE employees SET role_id = ? WHERE id = ?', [role.id, empId]);
        console.log('Employee role updated successfully.');
        startApp();
    } catch (err) {
        logErrorAndContinue(err, 'updateEmployeeRole');
    }
}

async function updateEmployeeManager(empId, currentTitle) {
    try {
        const roleResults = await queryDB('SELECT id FROM roles WHERE title = ?', [currentTitle]);
        const departmentId = roleResults[0].id;
        const employees = await queryDB('SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employees WHERE role_id = ?', [departmentId]);
        const managerChoices = employees.map(emp => emp.name);
        managerChoices.push('No Manager');
        const selection = await inquirer.prompt({
            type: 'list',
            name: 'newManagerName',
            message: 'Select the new manager for the employee or "No Manager":',
            choices: managerChoices
        });
        const manager = employees.find(emp => emp.name === selection.newManagerName);
        const managerId = manager ? manager.id : null;
        await queryDB('UPDATE employees SET manager_id = ? WHERE id = ?', [managerId, empId]);
        console.log('Employee manager updated successfully.');
        startApp();
    } catch (err) {
        logErrorAndContinue(err, 'updateEmployeeManager');
    }
}

function startApp() {
    console.log('Starting application...');
    inquirer.prompt(question1).then(response => {
        switch (response.choice) {
            case 'View all departments':
                displayDepartments();
                break;
            case 'View all roles':
                displayRoles();
                break;
            case 'View all employees':
                displayEmployees();
                break;
            case 'Add a department':
                addNewDepartment();
                break;
            case 'Add a role':
                addRole();
                break;
            case 'Add an employee':
                addEmployee();
                break;
            case 'Update an employee':
                updateEmployee();
                break;
            case 'Quit':
                db.end();
                break;
            default:
                console.log('Invalid choice, please try again.');
                startApp();
                break;
        }
    }).catch(error => {
        console.error('Error during inquirer prompt:', error);
        startApp();
    });
}
