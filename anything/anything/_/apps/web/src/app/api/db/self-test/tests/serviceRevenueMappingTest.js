import sql from "@/app/api/utils/sql";

export async function serviceRevenueMappingTest() {
  const results = [];

  try {
    // Test 1: Create revenue account mappings
    const revenueAccounts = await sql`
      SELECT id, account_number, account_name
      FROM chart_of_accounts
      WHERE account_type = 'revenue' AND is_active = true
      ORDER BY account_number
      LIMIT 5
    `;

    if (revenueAccounts.length === 0) {
      results.push({
        test: "Service revenue mapping",
        passed: false,
        error: "No revenue accounts found",
      });
      return results;
    }

    // Map service categories to revenue accounts
    const categories = [
      "repair",
      "maintenance",
      "installation",
      "diagnostic",
      "parts",
    ];

    for (
      let i = 0;
      i < Math.min(categories.length, revenueAccounts.length);
      i++
    ) {
      await sql`
        INSERT INTO service_category_revenue_mapping (service_category, revenue_account_id)
        VALUES (${categories[i]}, ${revenueAccounts[i].id})
        ON CONFLICT (service_category) 
        DO UPDATE SET revenue_account_id = ${revenueAccounts[i].id}
      `;
    }

    const mappings = await sql`
      SELECT COUNT(*) as count FROM service_category_revenue_mapping
    `;

    results.push({
      test: "Create service revenue mappings",
      passed: parseInt(mappings[0].count) >= 1,
      details: `Created ${mappings[0].count} revenue mappings`,
    });

    // Test 2: Verify mapping retrieval
    const [mapping] = await sql`
      SELECT 
        scrm.service_category,
        coa.account_number,
        coa.account_name
      FROM service_category_revenue_mapping scrm
      JOIN chart_of_accounts coa ON coa.id = scrm.revenue_account_id
      WHERE scrm.service_category = 'repair'
    `;

    results.push({
      test: "Retrieve revenue mapping",
      passed: !!mapping && mapping.service_category === "repair",
      details: mapping
        ? `Repair -> ${mapping.account_number} ${mapping.account_name}`
        : "No mapping found",
    });

    // Test 3: Update mapping
    const [newAccount] = await sql`
      SELECT id FROM chart_of_accounts
      WHERE account_type = 'revenue' AND is_active = true
      ORDER BY account_number DESC
      LIMIT 1
    `;

    if (newAccount) {
      await sql`
        UPDATE service_category_revenue_mapping
        SET revenue_account_id = ${newAccount.id}, updated_at = now()
        WHERE service_category = 'parts'
      `;

      const [updated] = await sql`
        SELECT revenue_account_id FROM service_category_revenue_mapping
        WHERE service_category = 'parts'
      `;

      results.push({
        test: "Update revenue mapping",
        passed: updated.revenue_account_id === newAccount.id,
        details: "Mapping updated successfully",
      });
    }
  } catch (err) {
    results.push({
      test: "Service revenue mapping",
      passed: false,
      error: err.message,
    });
  }

  // Test 4: Reject invalid category
  try {
    const [account] = await sql`
      SELECT id FROM chart_of_accounts WHERE account_type = 'revenue' LIMIT 1
    `;

    await sql`
      INSERT INTO service_category_revenue_mapping (service_category, revenue_account_id)
      VALUES ('invalid_category', ${account.id})
    `;

    results.push({
      test: "Reject invalid service category",
      passed: false,
      details: "Should have rejected invalid category",
    });
  } catch (err) {
    results.push({
      test: "Reject invalid service category",
      passed: true,
      details: "Correctly rejected invalid category",
    });
  }

  // Test 5: Prevent deletion of mapped revenue account
  try {
    const [mapping] = await sql`
      SELECT revenue_account_id FROM service_category_revenue_mapping LIMIT 1
    `;

    if (mapping) {
      await sql`
        DELETE FROM chart_of_accounts WHERE id = ${mapping.revenue_account_id}
      `;

      results.push({
        test: "Prevent deletion of mapped account",
        passed: false,
        details: "Should have prevented deletion of mapped account",
      });
    }
  } catch (err) {
    results.push({
      test: "Prevent deletion of mapped account",
      passed: true,
      details: "Correctly prevented deletion",
    });
  }

  return results;
}
