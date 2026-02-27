import { tableDefinitions } from "./general-ledger/table-definitions.js";
import { seedData } from "./general-ledger/seed-data.js";
import { helperFunctions } from "./general-ledger/helper-functions.js";
import { postingFunctions } from "./general-ledger/posting-functions.js";
import { triggerFunctions } from "./general-ledger/trigger-functions.js";
import { triggers } from "./general-ledger/triggers.js";
import { views } from "./general-ledger/views.js";

export const generalLedgerStatements = [
  ...tableDefinitions,
  ...seedData,
  ...helperFunctions,
  ...postingFunctions,
  ...triggerFunctions,
  ...triggers,
  ...views,
];
