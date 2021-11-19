const inquirer = require("inquirer");
require("console.table");
const connection = require("./config/connection");

// Array for the top level prompt.
const initialChoices = [
  {
    type: "list",
    name: "initialSelect",
    message: "Please select the following options:",
    choices: [
      "View All Employees",
      "Add Employee",
      "Update Employee Role",
      "View All Roles",
      "Add Role",
      "View All Departments",
      "Add Department",
      "Quit",
    ],
  },
];

// Array for use following prompt option to add a department.
const departmentQuestion = [
  {
    type: "input",
    name: "department",
    message: "Please enter the name of the new department:",
  },
];

// Function run when app is initiated. Asks user what they would like to do. This function is also run at the completion of any of the options.
const init = () => {
  inquirer.prompt(initialChoices).then(function (response) {
    switch (response.initialSelect) {
      case "View All Employees":
        checkEmployees();
        break;
      case "Add Employee":
        addEmployee();
        break;
      case "Update Employee Role":
        editEmployees();
        break;
      case "View All Roles":
       checkRoles();
        break;
      case "Add Role":
        addRole();
        break;
      case "View All Departments":
        checkDepartments();
        break;
      case "Add Department":
        addDepartment();
        break;
      case "Quit":
        connection.end();
        break;
      default:
        connection.end();
    }
  });
};

// View departments presents a formatted table showing department names and department ids.
const checkDepartments = () => {
  connection.query("SELECT * FROM department", function (err, res) {
    if (err) throw err;
    console.table(res);
    init();
  });
};

// View roles presents the job title, role id, the department that role belongs to, and the salary for that role.
const checkRoles = () => {
  connection.query(
    "SELECT role.id, role.title, department.name, role.salary FROM department INNER JOIN role ON role.department_id=department.id ORDER BY id;",
    function (err, res) {
      if (err) throw err;
      console.table(res);
      init();
    }
  );
};

// View employees presents with a formatted table showing employee data, including employee ids, first names, last names, job titles, departments, salaries, and managers that the employees report to.
const checkEmployees = () => {
  connection.query(
    "SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS Manager FROM employee INNER JOIN role ON employee.role_id=role.id INNER JOIN department ON role.department_id=department.id LEFT JOIN employee manager ON employee.manager_id = manager.id ORDER BY id;",
    function (err, res) {
      if (err) throw err;
      console.table(res);
      init();
    }
  );
};

// Add a department prompts to enter the name of the department and that department is added to the database.
const addDepartment = () => {
  inquirer.prompt(departmentQuestion).then(function (response) {
    connection.query(
      "INSERT INTO department SET ?",
      {
        name: response.department,
      },
      function (err) {
        if (err) throw err;
        console.table(response.department + " added into Departments.");
        init();
      }
    );
  });
};

// Add a role prompts to enter the name, salary, and department for the role and that role is added to the database. The department options are displayed as a list
// to choose from, including any departments the user has added.
const addRole = () => {
  connection.query("SELECT * FROM department", function (err, res) {
    if (err) throw err;

    let departmentArray = [];
    for (i = 0; i < res.length; i++) {
      departmentArray.push(res[i].name);
    }

    inquirer
      .prompt([
        {
          type: "input",
          name: "name",
          message: "Please enter the name of the new role:",
        },
        {
          type: "input",
          name: "salary",
          message: "Please enter the salary of this role:",
        },
        {
          type: "list",
          name: "department",
          message: "Please select the department this role belongs to:",
          choices: departmentArray,
        },
      ])
      .then(function (response) {
        let departmentID;
        for (j = 0; j < res.length; j++) {
          if (response.department == res[j].name) {
            departmentID = res[j].id;
          }
        }

        connection.query(
          "INSERT INTO role SET ?",
          {
            title: response.name,
            salary: response.salary,
            department_id: departmentID,
          },
          function (err) {
            if (err) throw err;
            console.log(response.name, "role has been added.");
            init();
          }
        );
      });
  });
};



const addEmployee = () => {
  connection.query("SELECT * FROM role", function (err, resRole) {
    if (err) throw err;

    let roleArray = [];
    for (i = 0; i < resRole.length; i++) {
      roleArray.push(resRole[i].title);
    }

    connection.query(
      "SELECT * FROM employee WHERE manager_id IS NULL",
      function (err, resManager) {
        if (err) throw err;

        let managerArray = [];
        for (j = 0; j < resManager.length; j++) {
          managerArray.push(resManager[j].first_name);
        }

        inquirer
          .prompt([
            {
              type: "input",
              name: "firstName",
              message: "First name?",
            },
            {
              type: "input",
              name: "lastName",
              message: "Last name?",
            },
            {
              type: "list",
              name: "role",
              message: "Role?",
              choices: roleArray,
            },
            {
              type: "list",
              name: "manager",
              message: "Employee's manager?",
              choices: managerArray,
            },
          ])
          .then(function (response) {
            let roleID;
            for (k = 0; k < resRole.length; k++) {
              if (response.role == resRole[k].title) {
                roleID = resRole[k].id;
              }
            }

            let managerID;
            for (l = 0; l < resManager.length; l++) {
              if (response.manager == resManager[l].first_name) {
                managerID = resManager[l].id;
              }
            }

            connection.query(
              "INSERT INTO employee SET ?",
              {
                first_name: response.firstName,
                last_name: response.lastName,
                role_id: roleID,
                manager_id: managerID
              },
              function (err) {
                if (err) throw err;
                console.log(
                  "New employee",
                  response.firstName,
                  "has been added to the database."
                );
                init();
              }
            );
          });
      }
    );
  });
};


const editEmployees = () => {
    connection.query("SELECT * FROM employee", function (err, resEmployee) {
        if (err) throw err;

        let employeeArray = [];
        for (i = 0; i < resEmployee.length; i++) {
            employeeArray.push(resEmployee[i].first_name)
        }

        connection.query("SELECT * FROM role", function (err, resRole) {
            if (err) throw err;

            let roleArray = [];
            for (j = 0; j < resRole.length; j++) {
                roleArray.push(resRole[j].title);
            }

            inquirer.prompt([
                {
                    type: "list",
                    name: "name",
                    message: "Which employee?",
                    choices: employeeArray,
                },
                {
                    type: "list",
                    name: "role",
                    message: "New role?",
                    choices: roleArray,
                }
            ])
            .then(function (response) {
                let employeeID;
                for (k = 0; k < resEmployee.length; k++) {
                    if (response.name == resEmployee[k].first_name) {
                        employeeID = resEmployee[k].id;
                    }
                  }

                let roleID;
                for (l = 0; l < resRole.length; l++) {
                    if (response.role == resRole[l].title) {
                        roleID = resRole[l].id;
                    }
                  }

                connection.query("UPDATE employee SET role_id = ? WHERE id = ?", [roleID, employeeID], function (err) {
                    if (err) throw err;
                    console.log(response.name, "has been updated to the role of", response.role);
                    init();
                }
                )
            })
        })
    })
};

init();