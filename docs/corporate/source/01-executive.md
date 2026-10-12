# TBP ERP — Executive Business Proposal

Addressed to: The Information Service Manager, The Building Practice Limited

Version 1.1 | 12 October 2026 | Commercial proposal — subject to formal acceptance

# 1. EXECUTIVE BUSINESS PROPOSAL

## 1.1 Introduction

The Building Practice Limited operates within a multidisciplinary professional environment where architectural design, engineering, construction management, quantity surveying, project coordination, finance, procurement, human resources and administrative services must function together efficiently.

As an organization grows, managing these operational responsibilities through disconnected spreadsheets, physical documentation, email correspondence and independent departmental processes can introduce significant inefficiencies.

These challenges may include:

- Limited visibility into project expenditure and profitability.
- Difficulty measuring employee productivity and resource utilization.
- Delays in departmental approvals and management decisions.
- Fragmented employee and organizational records.
- Inconsistent task monitoring and accountability.
- Inefficient procurement and inventory management.
- Limited financial visibility across active projects.
- Increased administrative workloads.
- Difficulty producing consolidated management reports.
- Greater exposure to operational and information-security risks.

To address these challenges, the proposed **TBP Enterprise Resource Planning System (TBP ERP)** will provide a centralized digital environment for managing the organization's core business operations.

Rather than requiring multiple independent software subscriptions, TBP ERP is designed as a unified enterprise application tailored to the operational structure and professional requirements of The Building Practice Limited.

The proposed solution will integrate ten major operational modules into a single secure platform accessible to authorized personnel across the organization.

## 1.2 Strategic Objective

The principal objective of TBP ERP is to establish a centralized, accountable and data-driven operational environment through which management can monitor organizational activities, coordinate departmental responsibilities and evaluate business performance.

The platform is intended to provide management with timely information regarding:

1. Employee deployment, productivity and associated labour costs.
2. Project execution, milestones and delivery performance.
3. Project profitability, expenditure and budget utilization.
4. Departmental productivity and outstanding responsibilities.
5. Revenue, invoicing, receivables and payment obligations.
6. Procurement expenditure and inventory movement.
7. Workforce administration and statutory records.
8. Organizational assets and facilities.
9. IT infrastructure, support incidents and software subscriptions.
10. Enterprise-wide operational performance.

**The long-term objective is to position TBP ERP as the organization's central operational management platform.**

---

# 2. BUSINESS VALUE AND EXPECTED ORGANIZATIONAL BENEFITS

## 2.1 Centralized Operational Management

All six departments will operate within one integrated system.

This will reduce dependence on disconnected records and improve the consistency of information exchanged between departments.

Authorized personnel will access relevant information through departmental dashboards, while executive management will receive consolidated reports.

## 2.2 Improved Project Financial Visibility

One of the most important capabilities of TBP ERP is its proposed project-costing and profitability engine.

Traditional project monitoring often focuses primarily on contract values, invoices, procurement expenditure and physical progress.

However, professional consulting organizations also incur substantial costs through employee time.

For example, an architect working on a project for 40 hours represents an attributable labour cost, even where no separate external payment is made.

TBP ERP will incorporate this cost into project financial reporting.

The resulting management information will include:

- Original and revised project contract values.
- Employee hours allocated to individual projects.
- Calculated employee hourly cost rates.
- Total attributable project labour expenditure.
- Procurement and material expenditure.
- Approved subcontractor costs.
- Site-related operational expenses.
- Project budget utilization.
- Estimated project gross profitability.
- Outstanding client invoices.
- Client payments received.
- Financial exposure on ongoing projects.

This will help management identify projects that are commercially healthy and those requiring intervention.

## 2.3 Employee Accountability and Performance Monitoring

The system will introduce structured task ownership, deadlines, progress monitoring and supervisory review.

Each task will maintain a traceable history of assignment, acceptance, submission, approval and revision.

Management will be able to identify:

- Outstanding assignments.
- Overdue responsibilities.
- Employees awaiting supervisory feedback.
- Tasks requiring revision.
- Time spent completing deliverables.
- Repeated rework.
- Departmental workload distribution.
- Project-related employee utilization.

These capabilities are intended to improve accountability and planning rather than replace professional judgment in employee performance evaluation.

## 2.4 Financial and Administrative Efficiency

By integrating payroll, procurement, project expenditure, staff records and departmental approvals, TBP ERP will reduce repetitive administrative work.

Information entered into an authorized module can become available to related processes without unnecessary manual re-entry.

For example:

**Project Requisition → Procurement Review → LPO Approval → Goods Receipt → Project Cost Allocation → Financial Reporting**

This provides a traceable operational and financial history.

## 2.5 Long-Term Cost Predictability

The commercial arrangement provides TBP with a perpetual enterprise license rather than recurring per-employee software licensing charges.

The proposed one-time enterprise license and implementation fee is:

**₦4,500,000.00**

The optional annual maintenance arrangement is:

**₦675,000.00**

This structure separates ownership of the right to use the software from the recurring cost of maintaining and supporting its operation.

---

# 3. PROPOSED SYSTEM ARCHITECTURE

## 3.1 Application Overview

TBP ERP is designed as a secure, browser-based enterprise application.

Authorized personnel will access the platform using desktop computers, laptops, tablets or compatible mobile devices.

The application will consist of three principal layers.

### A. Presentation Layer

The user interface will provide:

- Secure employee authentication.
- Department-specific navigation.
- Responsive dashboards.
- Forms and approval workflows.
- Project management interfaces.
- Financial reporting interfaces.
- Notification and messaging interfaces.
- Administrative configuration tools.

**Proposed Technology:** React 19.

### B. Application and Business Logic Layer

The backend will manage:

- Authentication and authorization.
- Departmental business rules.
- Task workflow processing.
- Project cost calculations.
- Payroll processing.
- Approval routing.
- Notification generation.
- Data validation.
- Report generation.
- Audit logging.

**Proposed Technology:** Node.js with Express 5.

### C. Data Management Layer

The database will maintain structured records relating to:

- Employees.
- Departments and roles.
- Projects and milestones.
- Tasks and timesheets.
- Financial transactions.
- Procurement activities.
- Inventory.
- Payroll.
- Organizational assets.
- Audit events.

**Proposed Technology:** MySQL 8.4 with Prisma ORM.

The proposed architecture is subject to technical verification and final deployment configuration.

## 3.2 Deployment Environment

The production deployment will use an appropriately secured hosting environment agreed upon by both parties.

The deployment architecture should provide:

1. HTTPS encryption.
2. Database access restrictions.
3. Application process monitoring.
4. Automated backup scheduling.
5. Controlled administrative access.
6. Application and infrastructure logging.
7. Environment-specific configuration.
8. Backup restoration procedures.
9. Security update mechanisms.
10. Production recovery documentation.

Hosting charges, domain registration, email delivery services, SMS gateways and third-party cloud subscriptions must be separately identified in the approved hosting budget unless expressly included in the final commercial agreement.

---

# 4. ORGANIZATIONAL COVERAGE

TBP ERP will support the organization's six principal operational departments.

| Department | Principal Responsibilities | ERP Coverage |
|---|---|---|
| Human Resources | Employee administration and workforce management | Personnel records, payroll information, attendance, leave, recruitment, training and appraisals |
| Architecture and Projects | Design, engineering and project execution | Project tracking, assignments, drawings, milestones, RFIs, site reporting and profitability |
| Accounts and Finance | Financial control and reporting | Invoicing, expenses, payment approvals, payroll, budgeting and financial analysis |
| Procurement and Store | Purchasing and inventory control | Requisitions, vendors, LPOs, goods receipt and stock management |
| Administration | Organizational facilities and administration | Assets, vehicles, facilities, visitors and internal announcements |
| Information Technology | Technology operations and system administration | User administration, permissions, software licenses, incidents and IT support |

The application will also provide executive-level oversight for appropriately authorized management personnel.

Access will be controlled through role-based permissions.

The proposed role structure anticipates approximately sixteen operational role categories. The final role catalogue and permissions will be confirmed during requirements validation.

---

# 5. COMPLETE FUNCTIONAL SCOPE

The following modules constitute the proposed implementation scope.

Their inclusion in this document defines the intended contractual deliverables. It does not, by itself, confirm that every feature is already implemented or production-ready.

Each module will be subject to testing and formal acceptance.

## MODULE 1: IDENTITY, ACCESS CONTROL AND INFORMATION SECURITY

This module will establish the security foundation of TBP ERP.

### Functional Requirements

**Employee Authentication**

Authorized users will access the system through registered corporate credentials.

Authentication controls will include:

- Secure password hashing.
- Password complexity requirements.
- Session expiration.
- Refresh-token management.
- Password recovery.
- Account activation.
- Account suspension.
- Access revocation.
- Protection against unauthorized login attempts.

**Role-Based Access Control**

The system will maintain configurable access permissions based on employee responsibilities.

Examples include:

`employees:read`

`employees:manage`

`projects:manage`

`tasks:assign`

`timesheets:approve`

`hourly_rate:read`

`payroll:manage`

`invoices:create`

`payments:approve`

`procurement:approve`

`reports:export`

Access restrictions must be enforced by the backend, not merely by hiding interface elements.

**Confidential Information Protection**

Sensitive employee information will be subject to enhanced security controls.

This includes:

- National Identification Numbers.
- Bank Verification Numbers.
- Bank account details.
- Salary information.
- Personal identification documents.
- Digital signatures.
- Disciplinary records.

Where implemented, application-level AES-256-GCM encryption will protect designated sensitive fields.

Encryption keys must be managed separately from the encrypted data.

**Audit Logging**

Security-sensitive actions will generate audit records.

These records should identify:

- The user performing the action.
- The action performed.
- The affected record.
- The date and time.
- Relevant change metadata.
- The originating session or network information, where appropriate.

Audit records should be protected against unauthorized modification and deletion.

**Acceptance Requirement:** Unauthorized users must be unable to retrieve restricted information through either the user interface or direct API requests.

---

## MODULE 2: EXECUTIVE AND DEPARTMENTAL DASHBOARDS

Each department will receive a workspace tailored to its operational responsibilities.

### Executive Management Dashboard

The executive dashboard will consolidate approved management indicators, including:

- Active projects.
- Project profitability.
- Outstanding receivables.
- Departmental expenditure.
- Staff deployment.
- Pending executive approvals.
- Overdue assignments.
- Procurement commitments.
- Workforce statistics.
- Operational risk indicators.

### Departmental Dashboards

Department-specific dashboards will provide relevant operational metrics.

For example, the Projects dashboard will emphasize milestones, drawings, project tasks and site progress.

The Finance dashboard will emphasize revenue, expenses, invoices, budgets and payment approvals.

The HR dashboard will emphasize workforce statistics, leave, attendance and employee administration.

**Acceptance Requirement:** Dashboard figures must correspond to the underlying authorized records and update according to the agreed refresh mechanism.

---

## MODULE 3: HUMAN RESOURCES MANAGEMENT

This module will serve as the central employee administration system.

### Employee Records

The platform will maintain structured employee records containing more than 45 relevant information fields.

These will cover:

- Personal information.
- Contact details.
- Emergency contacts.
- Employment information.
- Departmental assignments.
- Reporting relationships.
- Qualifications.
- Professional certifications.
- Banking information.
- Compensation records.
- Employment history.
- Statutory identifiers.
- Benefits information.
- Relevant compliance acknowledgments.

### Leave Management

Employees will submit leave requests electronically.

The system will calculate eligible working days according to approved TBP leave policies and an administratively maintained Nigerian public holiday calendar.

The standard annual leave entitlement can be configured as 25 working days where approved by TBP.

The approval process will include:

Employee Submission → Supervisor Review → HR Confirmation → Leave Record Update

The application will prevent unauthorized self-approval.

### Attendance Management

Authorized employees will record attendance through approved check-in and check-out mechanisms.

Attendance categories may include:

- Present.
- Late.
- Absent.
- On-site.
- Remote.
- On approved leave.

Attendance policies, late thresholds and exceptions will be configurable.

Biometric hardware integration, if required, will be separately specified because device compatibility and integration costs depend on the selected equipment.

### Payroll Administration

HR and Finance will maintain compensation structures and generate payroll information according to approved company policies.

Payroll controls will include restricted access, effective-dated salary records and approval procedures.

### Training and Performance

The system will record:

- Training programs.
- Employee participation.
- Professional certifications.
- Certification expiry dates.
- Performance review periods.
- Supervisor assessments.
- Relevant performance indicators.

**Acceptance Requirement:** Authorized HR personnel must be able to complete the agreed employee lifecycle processes while confidential records remain inaccessible to unauthorized users.

---

## MODULE 4: TASK MANAGEMENT AND STAFF ACCOUNTABILITY

This module will provide a structured workflow for assigning, tracking and reviewing employee responsibilities.

### Task Lifecycle

A standard assignment will follow:

**Assigned → Accepted → In Progress → Submitted for Review → Approved / Returned for Revision**

The system will capture:

- Task creator.
- Responsible employee.
- Department.
- Related project, where applicable.
- Priority.
- Assignment date.
- Due date.
- Acceptance timestamp.
- Submission timestamp.
- Reported hours.
- Deliverables.
- Supervisor feedback.
- Completion status.

### Automated Notifications

The system will generate notifications for:

- New assignments.
- Upcoming deadlines.
- Overdue tasks.
- Submitted deliverables.
- Approved submissions.
- Returned assignments.

A scheduled background process will periodically evaluate outstanding assignments.

The frequency of reminders and escalation rules will be configurable.

### Rework Tracking

Returned assignments will preserve revision history.

Additional time spent completing revisions can be recorded separately.

This will allow management to understand rework effort and its financial implications.

**Acceptance Requirement:** Task state changes, notifications, approvals and revision histories must remain traceable and consistent.

---

## MODULE 5: PROJECT MANAGEMENT AND AEC OPERATIONS

This module will provide operational oversight for architectural, engineering and construction-related projects.

### Project Registration

Every project will have a unique reference number.

Project records will include:

- Project name.
- Project reference.
- Client information.
- Project description.
- Project coordinator.
- Contract value.
- Approved variations.
- Start date.
- Target completion date.
- Project status.
- Budget information.
- Assigned personnel.

### Milestone Management

Projects will be divided into defined delivery milestones.

Each milestone will contain:

- Description.
- Responsible personnel.
- Target date.
- Completion status.
- Supporting documentation.
- Approval information.

### Drawing Register

The drawing register will manage:

- Drawing identification.
- Discipline.
- Revision number.
- Submission date.
- Review status.
- Approval status.
- Uploaded documents.
- Superseded versions.

### Site Reporting

Authorized project personnel will maintain site activity records.

These may include:

- Daily activities.
- Weather conditions.
- Site workforce.
- Material deliveries.
- Progress observations.
- Site instructions.
- Identified risks.
- Photographic evidence.

### Requests for Information

The RFI workflow will support:

- RFI creation.
- Assignment.
- Response deadlines.
- Technical clarification.
- Supporting documents.
- Closure records.

**Acceptance Requirement:** Management must be able to retrieve a consolidated project record containing current progress, milestones, documentation and outstanding operational issues.

---

# 6. MODULE 6: PROJECT COSTING AND PROFITABILITY ENGINE

## 6.1 Strategic Importance

The proposed project profitability engine is a distinguishing component of TBP ERP.

It will connect employee compensation, approved timesheets, procurement costs, subcontractor expenditure and project revenue.

Its purpose is to provide management with a more comprehensive understanding of the financial performance of each project.

## 6.2 Employee Hourly Cost Calculation

The proposed standard calculation is:

**Employee Hourly Cost = Monthly Gross Salary ÷ 195**

The 195-hour denominator represents a proposed costing convention based on a 45-hour working week averaged across the year.

It should not automatically be interpreted as 195 productive or billable hours.

TBP may elect to adopt a different denominator for costing purposes.

### Example

Employee Monthly Gross Salary: ₦950,000

Standard Monthly Costing Hours: 195

**Calculated Hourly Cost: ₦4,871.79**

If the employee records 40 approved project hours:

40 × ₦4,871.79 = **₦194,871.60**

This amount becomes the attributable labour cost for that employee's recorded work.

### Confidentiality

Authorized project costing personnel may view approved hourly cost rates without receiving access to underlying confidential salary details.

## 6.3 Project Time Recording

Project personnel will record time spent on approved activities.

Each entry will identify:

- Employee.
- Project.
- Related task or milestone.
- Work description.
- Work date.
- Hours worked.
- Approval status.
- Applicable hourly rate.
- Calculated labour cost.
- Rework classification, where applicable.

Approved historical time entries will preserve the hourly rate applicable when the work was performed.

This will prevent subsequent salary changes from retroactively altering historical project costs.

## 6.4 Project Profitability Calculation

The system will calculate attributable project costs using:

**Total Project Cost = Labour Cost + Procurement Cost + Subcontractor Cost + Direct Project Expenses + Allocated Overheads**

Allocated overheads will only be included where TBP approves an allocation policy.

The application must prevent double-counting between LPO commitments, goods received, inventory issues and supplier invoices.

### Projected Gross Profit

**Projected Gross Profit = Revised Contract Value − Forecast Total Project Cost**

### Projected Gross Margin

**Projected Gross Margin (%) = Projected Gross Profit ÷ Revised Contract Value × 100**

### Cost-to-Date Position

**Cost-to-Date = Approved Labour Cost + Recognized Procurement Cost + Other Recognized Project Costs**

### Cash Position

**Project Cash Position = Client Payments Received − Actual Project Cash Outflows**

This cash measure must be distinguished from accounting profit.

A project can be profitable on an accrual basis while experiencing negative cash flow.

## 6.5 Example Project Financial Report

Consider the following illustrative project:

| Financial Component | Amount |
|---|---:|
| Original Contract Value | ₦25,000,000 |
| Approved Client Variations | ₦2,500,000 |
| Revised Contract Value | ₦27,500,000 |
| Staff Labour Cost | ₦4,200,000 |
| Procurement and Materials | ₦6,800,000 |
| Subcontractor Expenditure | ₦3,500,000 |
| Site and Operational Expenses | ₦1,200,000 |
| Total Attributable Project Cost | ₦15,700,000 |
| Estimated Gross Profit | ₦11,800,000 |
| Estimated Gross Profit Margin | 42.91% |

These figures are illustrative, not a forecast of actual TBP project performance. The stated estimated gross profit assumes that ₦15,700,000 represents forecast total project cost. If it represents only cost-to-date, remaining forecast costs must be included before calculating projected gross profit.

Actual financial reporting will depend on complete, approved and accurately classified transaction records.

---

# 7. FINANCE, PROCUREMENT AND ADMINISTRATIVE MODULES

## 7.1 Module 7: Accounts and Finance

The finance module will support:

- Client invoicing.
- Payment recording.
- Expense claims.
- Budget administration.
- Payment approvals.
- Payroll summaries.
- Financial reporting.
- Project financial analysis.
- Receivables monitoring.

Applicable Nigerian tax rates and deduction rules will be configurable and subject to verification against legislation effective at the transaction date.

The platform will not be represented as a certified accounting or tax-compliance solution unless the relevant certification or validation has been completed.

## 7.2 Module 8: Procurement and Inventory

The procurement module will provide an auditable purchasing process.

The standard workflow will be:

**Purchase Requisition → Review → Approval → Purchase Order → Delivery → Goods Receipt → Inventory Update**

The platform will maintain:

- Supplier records.
- Purchase requests.
- Approval histories.
- Local Purchase Orders.
- Goods Received Notes.
- Inventory locations.
- Material quantities.
- Unit costs.
- Stock movements.
- Reorder thresholds.

## 7.3 Module 9: Administration

The administration module will support:

- Fixed asset registration.
- Asset assignment.
- Vehicle information.
- Vehicle booking.
- Facility maintenance.
- Generator servicing.
- Visitor registration.
- Administrative announcements.

## 7.4 Module 10: IT Service Management, Messaging and Enterprise Reporting

The IT module will support:

- Helpdesk requests.
- Incident classification.
- IT asset records.
- Software subscriptions.
- License renewal reminders.
- Maintenance activities.
- User account administration.
- Operational reporting.

## 7.5 Module 10 continued: Messaging and Reporting

The platform will include internal communications and consolidated reporting capabilities.

Reports may be exported in approved formats such as PDF, CSV and Excel.

---

# 8. IMPLEMENTATION METHODOLOGY

The implementation will follow a structured delivery process.

## Phase 1: Project Mobilization and Technical Assessment

**Proposed Period:** October 2026

Activities:

- Formal project commencement.
- Confirmation of authorized stakeholders.
- Review of the existing application.
- Repository and architecture assessment.
- Review of outstanding functionality.
- Confirmation of module requirements.
- Confirmation of hosting requirements.
- Preparation of the implementation backlog.

**Deliverable:** Approved implementation baseline and project execution plan.

## Phase 2: Core Module Completion and Integration

**Proposed Period:** October–November 2026

Activities:

- Completion of outstanding features.
- Integration of departmental workflows.
- Implementation of project costing.
- Configuration of access permissions.
- Integration of reporting.
- Data validation.
- Initial testing.

**Deliverable:** Integrated application ready for formal staging validation.

## Phase 3: Quality Assurance and User Acceptance Testing

**Proposed Period:** November–December 2026

Activities:

- Functional testing.
- Security verification.
- Role-based access testing.
- Financial calculation validation.
- Workflow testing.
- Defect correction.
- Departmental UAT sessions.
- Preparation of training materials.

**Deliverable:** UAT-approved release candidate.

## Phase 4: Production Deployment and Handover

**Target:** On or before 31 December 2026

Activities:

- Production environment configuration.
- Database deployment.
- Authorized data migration.
- Application deployment.
- Backup activation.
- Administrative account configuration.
- Departmental training.
- Final verification.
- Formal handover.

**Deliverable:** Operational production environment and signed handover certificate.

The December 2026 target assumes timely mobilization, access to required information and infrastructure, and prompt completion of TBP's review and approval responsibilities. Any unconditional delivery guarantee should be agreed only after the outstanding development scope has been technically assessed.

---

# 9. FORMAL ACCEPTANCE CRITERIA

The implementation will be considered ready for final acceptance when:

1. All ten agreed modules have been delivered in accordance with the approved requirements.
2. Critical workflows have passed functional testing.
3. No unresolved critical or high-severity defects prevent normal operation.
4. Role-based permissions have been tested.
5. Financial calculations have been validated against agreed test cases.
6. Backup and restoration procedures have been demonstrated.
7. Authorized departmental representatives have completed UAT.
8. Administrative documentation has been delivered.
9. Agreed staff training has been completed.
10. Production access has been verified.

Minor defects that do not materially affect normal operations may be documented in a mutually agreed post-launch correction register.

---

# 10. TRAINING, DOCUMENTATION AND KNOWLEDGE TRANSFER

The implementation will include structured knowledge transfer.

### Administrator Training

For the Information and Service Manager and authorized system administrators:

- User management.
- Role assignment.
- Permission configuration.
- System settings.
- Backup administration.
- Audit-log review.
- Basic troubleshooting.
- Incident escalation.

### Departmental Training

Training will cover the relevant workflows for:

- Human Resources.
- Projects.
- Finance.
- Procurement.
- Administration.
- Information Technology.

### Handover Documentation

The final handover package will include:

- User operating guide.
- Administrator guide.
- Deployment documentation.
- Backup and recovery procedures.
- System configuration reference.
- Known limitations register.
- Support escalation information.
- UAT records.
- Handover certificate.

---

# 11. COMMERCIAL INVESTMENT PROPOSAL

## 11.1 Standard Commercial Valuation

The standard commercial valuation for the proposed enterprise implementation and perpetual software license is:

### ₦9,000,000.00
**Nine Million Naira Only**

This valuation represents the proposed development, configuration, implementation and enterprise licensing arrangement.

## 11.2 Preferential Enterprise Concession

In recognition of the existing professional relationship and ongoing technical collaboration with The Building Practice Limited, particularly through its Information and Service Management function, a preferential commercial concession is being extended.

The concession reduces the proposed enterprise investment by 50%.

| Commercial Description | Amount |
|---|---:|
| Standard Enterprise Valuation | ₦9,000,000 |
| Preferential Commercial Concession (50%) | −₦4,500,000 |
| **Final Proposed Enterprise Investment** | **₦4,500,000** |

### FINAL PROPOSED CONTRACT VALUE

### ₦4,500,000.00
**Four Million, Five Hundred Thousand Naira Only**

This amount covers the agreed implementation scope and the perpetual right to use the delivered TBP ERP application.

Applicable taxes and statutory deductions will be addressed in the final invoice and contract.

---

# 12. PROPOSED PAYMENT STRUCTURE

The total amount will be paid in three installments.

| Payment Stage | Description | Amount |
|---|---|---:|
| First Installment | Contract acceptance and project mobilization | ₦1,500,000 |
| Second Installment | Successful staging delivery and UAT acceptance | ₦1,500,000 |
| Third Installment | Production deployment, training and formal handover | ₦1,500,000 |
| **TOTAL** | **Full Implementation and Perpetual Enterprise License** | **₦4,500,000** |

## 12.1 Initial Commitment Payment

The initial commitment fee of:

**₦1,500,000.00**

will become payable upon execution of the agreement and issuance of the corresponding invoice.

This payment will authorize formal project mobilization and commencement of the agreed implementation activities.

## 12.2 Second Milestone Payment

The second installment of:

**₦1,500,000.00**

will become payable following successful staging delivery and documented UAT acceptance.

## 12.3 Final Milestone Payment

The final installment of:

**₦1,500,000.00**

will become payable upon successful production deployment, agreed training and formal handover.

The perpetual enterprise license will become fully effective upon settlement of the agreed contract value.

---

# 13. PERPETUAL SOFTWARE LICENSE

Upon full settlement of the one-time contract value, The Building Practice Limited will receive a perpetual, non-exclusive enterprise license to use the delivered TBP ERP application for its internal business operations.

### License Benefits

The license will provide:

- No annual software license renewal requirement.
- No recurring per-employee license fee.
- No recurring per-department license fee.
- Continued use of the licensed version.
- Access to the organization's historical data.
- Continued operation without mandatory maintenance subscription payments.

The perpetual license does not automatically transfer ownership of the software's underlying intellectual property or source code.

Those rights must be expressly defined in the Master Software License Agreement.

The license also does not mean that hosting, cloud infrastructure, internet connectivity, third-party services or future technical support are free indefinitely.

---

# 14. POST-IMPLEMENTATION WARRANTY

Following production acceptance, the Developer will provide a complimentary warranty period of:

## 90 CALENDAR DAYS

The warranty will cover:

- Correction of reproducible software defects.
- Resolution of implementation-related faults.
- Stabilization of delivered workflows.
- Correction of agreed calculation defects.
- Assistance with deployment-related configuration issues.
- Reasonable technical guidance for authorized administrators.

The warranty will not automatically include entirely new modules, major scope expansions, third-party subscription costs or defects caused by unauthorized modifications.

---

# 15. OPTIONAL ANNUAL MAINTENANCE AND SERVICE AGREEMENT

Following the complimentary warranty period, TBP may elect to subscribe to an annual maintenance and support arrangement.

### Proposed Annual Fee

### ₦675,000.00

**Six Hundred and Seventy-Five Thousand Naira Only**

Equivalent to:

**₦56,250 per month**, calculated for comparison purposes.

The subscription will cover the agreed ongoing maintenance services, including:

- Application health monitoring.
- Technical incident support.
- Corrective software maintenance.
- Preventive maintenance.
- Security updates.
- Backup monitoring.
- Periodic restoration testing.
- Minor application improvements.
- Agreed software updates.
- Operational consultation.

A precise uptime commitment, support hours, recovery objectives and third-party hosting responsibilities will be established in the Service Level Agreement.

The annual maintenance fee should not be represented as including unlimited feature development or unlimited third-party cloud expenditure.

---

# 16. DATA OWNERSHIP AND BUSINESS CONTINUITY

All business data entered into or generated through TBP ERP will remain under the ownership and control of The Building Practice Limited, subject to applicable Nigerian law and individual data-subject rights.

This includes:

- Employee records.
- Payroll information.
- Project documents.
- Financial transactions.
- Procurement records.
- Supplier information.
- Operational reports.
- Organizational records.

TBP will retain the contractual right to obtain its data in a reasonably accessible format.

The Developer will not be permitted to withhold TBP's business data as a means of compelling renewal of an optional maintenance subscription.

Appropriate data protection, confidentiality and security provisions will be included in the final agreement.

---

# 17. CONCLUSION AND FORMAL RECOMMENDATION

TBP ERP represents an opportunity for The Building Practice Limited to establish an integrated operational system designed specifically around its organizational structure and professional activities.

The proposed platform will consolidate departmental processes, improve accountability, strengthen operational reporting and introduce project profitability analysis that incorporates employee labour costs alongside procurement and other project expenditure.

The commercial proposal provides TBP with a preferential enterprise investment of **₦4,500,000**, representing a 50% concession against the proposed standard valuation of ₦9,000,000.

The arrangement includes a perpetual enterprise software license, phased implementation, formal testing, staff training, production handover and a 90-day complimentary warranty.

An optional annual maintenance agreement of **₦675,000** will provide a structured mechanism for continued technical support, preventive maintenance and agreed updates.

**Approval of this proposal will authorize the parties to proceed with the Master Software License, Implementation and Service Level Agreement and commence formal project mobilization upon payment of the initial ₦1,500,000 commitment fee.**

---

# 18. EXECUTIVE INVESTMENT SUMMARY AND APPROVAL

| Item | Proposed Arrangement |
|---|---|
| Solution | Integrated TBP Enterprise Resource Planning System |
| Client | The Building Practice Limited |
| Addressee and primary coordinator | The Information Service Manager |
| Organisational coverage | Six departments; ten integrated modules |
| Standard proposed commercial valuation | ₦9,000,000 |
| Preferential Enterprise Partnership Concession | 50% (₦4,500,000) |
| Final proposed contract value | ₦4,500,000 |
| First instalment | ₦1,500,000 — execution and invoice / mobilisation |
| Second instalment | ₦1,500,000 — staging delivery and written UAT acceptance |
| Third instalment | ₦1,500,000 — production deployment, training and handover |
| Licence | Perpetual enterprise licence upon full payment |
| Per-employee / per-department licence fee | None for the licensed application |
| Target deployment | On or before 31 December 2026, subject to baselining |
| Complimentary warranty | 90 calendar days from production acceptance |
| Optional annual maintenance | ₦675,000; separately activated after warranty |
| Final approval authority | Authorised TBP executive management |

## 18.1 Matters requiring confirmation before execution

The proposed standard valuation is the provider's commercial reference, not an independently verified market valuation. The preferential enterprise partnership concession does not reduce the approved implementation scope, licence rights or warranty commitments.

Before execution, the parties shall confirm their legal identities and addresses; source-code access and third-party maintenance rights; the treatment of VAT and statutory deductions; invoice payment periods; hosting and third-party budgets; the verified development-status register; the implementation baseline; data migration responsibilities; and the precise maintenance coverage, service levels and recovery objectives.

A perpetual licence does not transfer intellectual property automatically and does not include perpetual free hosting, unlimited enhancements or indefinite technical support. The source-code arrangement must be expressly selected in the separate agreement. The proposed ₦675,000 annual fee must be supported by a sustainable, explicitly defined service scope.

## 18.2 Approval requested

Authorisation is requested to proceed with contract finalisation for the proposed TBP ERP implementation and perpetual enterprise licence at ₦4,500,000, and to release the first ₦1,500,000 instalment following execution and receipt of the corresponding invoice. Approval of this proposal does not replace the separate executed agreement or resolve its outstanding provisions.

| Approval record | Completion by authorised representatives |
|---|---|
| Decision | Approve subject to contract / Defer / Decline |
| Conditions | ________________________________________ |
| Information Service Manager | Name: _________________________________ |
| Coordination acknowledgment | Signature: __________________ Date: __________ |
| Executive approval | Name / title: _____________________________ |
| Authorised signature | Signature: __________________ Date: __________ |
| Finance confirmation | Name / signature: __________________________ |

The Information Service Manager's acknowledgment confirms project coordination and does not independently make the signatory a contracting party or confer executive approval authority.
