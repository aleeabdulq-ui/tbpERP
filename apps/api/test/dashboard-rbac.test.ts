import assert from "node:assert/strict";
import test from "node:test";
import { dashboardKind } from "../src/modules/dashboard/dashboard.routes.js";

test("maps departments and specialist roles to the correct dashboard", () => {
  assert.equal(dashboardKind("Head of HR", "HR"), "hr");
  assert.equal(dashboardKind("Architect", "PRJ"), "projects");
  assert.equal(dashboardKind("Platform Administrator", "IT"), "it");
  assert.equal(dashboardKind("Head of Accounts", "ACC"), "finance");
  assert.equal(dashboardKind("Procurement", "PROC"), "procurement");
  assert.equal(dashboardKind("Administration", "ADM"), "administration");
});

test("does not grant a specialist dashboard to unrelated employees", () => {
  assert.equal(dashboardKind("Employee", "PART"), "employee");
});
