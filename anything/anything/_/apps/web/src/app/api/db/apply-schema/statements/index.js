import { coreStatements } from "./core";
import { jobsStatements } from "./jobs";
import { serviceCatalogStatements } from "./service-catalog";
import { estimatesStatements } from "./estimates";
import { invoicesStatements } from "./invoices";
import { paymentsStatements } from "./payments";
import { creditsStatements } from "./credits";
import { expensesStatements } from "./expenses";
import { bankingStatements } from "./banking";
import { accountsPayableStatements } from "./accounts-payable";
import { payrollStatements } from "./payroll";
import { communicationsStatements } from "./communications";
import { viewsAndTriggersStatements } from "./views-and-triggers";
import { openingBalancesStatements } from "./opening-balances";
import { generalLedgerStatements } from "./general-ledger";
import { seedStatements } from "./seeds";
import { rawContextStatements } from "./raw-context";

export const statements = [
  ...coreStatements,
  ...jobsStatements,
  ...serviceCatalogStatements,
  ...estimatesStatements,
  ...invoicesStatements,
  ...paymentsStatements,
  ...creditsStatements,
  ...expensesStatements,
  ...bankingStatements,
  ...accountsPayableStatements,
  ...payrollStatements,
  ...communicationsStatements,
  ...viewsAndTriggersStatements,
  ...openingBalancesStatements,
  ...generalLedgerStatements,
  ...seedStatements,
  ...rawContextStatements,
];
