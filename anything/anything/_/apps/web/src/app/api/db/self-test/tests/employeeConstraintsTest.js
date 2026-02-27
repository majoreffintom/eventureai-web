import sql from "@/app/api/utils/sql";

export async function employeeConstraintsTest() {
  const results = [];

  // Test 1: Create valid hourly employee
  try {
    const [emp] = await sql`
      INSERT INTO employees (first_name, last_name, email, phone, role, pay_type, hourly_rate)
      VALUES ('John', 'Doe', 'john.doe@test.com', '555-1234', 'technician', 'hourly', 25.00)
      RETURNING id, first_name, last_name, hourly_rate, pay_type
    `;
    results.push({
      test: "Create hourly employee",
      passed: emp.hourly_rate === "25.00" && emp.pay_type === "hourly",
      details: `Created employee ${emp.first_name} ${emp.last_name}`,
    });
  } catch (err) {
    results.push({
      test: "Create hourly employee",
      passed: false,
      error: err.message,
    });
  }

  // Test 2: Create valid salary employee
  try {
    const [emp] = await sql`
      INSERT INTO employees (first_name, last_name, email, role, pay_type, salary_annual)
      VALUES ('Jane', 'Smith', 'jane.smith@test.com', 'admin', 'salary', 75000.00)
      RETURNING id, first_name, last_name, salary_annual, pay_type
    `;
    results.push({
      test: "Create salary employee",
      passed: emp.salary_annual === "75000.00" && emp.pay_type === "salary",
      details: `Created employee ${emp.first_name} ${emp.last_name}`,
    });
  } catch (err) {
    results.push({
      test: "Create salary employee",
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Reject hourly employee without rate
  try {
    await sql`
      INSERT INTO employees (first_name, last_name, role, pay_type)
      VALUES ('Bad', 'Employee', 'technician', 'hourly')
    `;
    results.push({
      test: "Reject hourly without rate",
      passed: false,
      details: "Should have rejected employee without hourly_rate",
    });
  } catch (err) {
    results.push({
      test: "Reject hourly without rate",
      passed: true,
      details: "Correctly rejected: " + err.message,
    });
  }

  // Test 4: Reject salary employee without annual salary
  try {
    await sql`
      INSERT INTO employees (first_name, last_name, role, pay_type)
      VALUES ('Bad', 'Employee', 'admin', 'salary')
    `;
    results.push({
      test: "Reject salary without annual",
      passed: false,
      details: "Should have rejected employee without salary_annual",
    });
  } catch (err) {
    results.push({
      test: "Reject salary without annual",
      passed: true,
      details: "Correctly rejected: " + err.message,
    });
  }

  // Test 5: Email uniqueness constraint
  try {
    await sql`
      INSERT INTO employees (first_name, last_name, email, role, pay_type, hourly_rate)
      VALUES ('Duplicate', 'Email', 'john.doe@test.com', 'technician', 'hourly', 20.00)
    `;
    results.push({
      test: "Email uniqueness",
      passed: false,
      details: "Should have rejected duplicate email",
    });
  } catch (err) {
    results.push({
      test: "Email uniqueness",
      passed: true,
      details: "Correctly rejected duplicate email",
    });
  }

  // Test 6: Soft delete allows email reuse
  try {
    const [emp] = await sql`
      SELECT id FROM employees WHERE email = 'john.doe@test.com' AND is_deleted = false
    `;

    await sql`
      UPDATE employees 
      SET is_deleted = true, deleted_at = now(), is_active = false
      WHERE id = ${emp.id}
    `;

    const [newEmp] = await sql`
      INSERT INTO employees (first_name, last_name, email, role, pay_type, hourly_rate)
      VALUES ('New', 'John', 'john.doe@test.com', 'technician', 'hourly', 30.00)
      RETURNING id
    `;

    results.push({
      test: "Email reuse after soft delete",
      passed: !!newEmp.id,
      details: "Successfully reused email after soft delete",
    });
  } catch (err) {
    results.push({
      test: "Email reuse after soft delete",
      passed: false,
      error: err.message,
    });
  }

  // Test 7: Invalid role rejection
  try {
    await sql`
      INSERT INTO employees (first_name, last_name, role, pay_type, hourly_rate)
      VALUES ('Bad', 'Role', 'invalid_role', 'hourly', 20.00)
    `;
    results.push({
      test: "Reject invalid role",
      passed: false,
      details: "Should have rejected invalid role",
    });
  } catch (err) {
    results.push({
      test: "Reject invalid role",
      passed: true,
      details: "Correctly rejected invalid role",
    });
  }

  return results;
}
