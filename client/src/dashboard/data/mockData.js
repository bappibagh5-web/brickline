export const NAV_ITEMS = [
  { key: 'home', label: 'Home' },
  { key: 'loan-requests', label: 'Loan Requests' },
  { key: 'documents', label: 'Account Documents' },
  { key: 'messages', label: 'Messages', badge: 1 },
  { key: 'tasks', label: 'Tasks' },
  { key: 'resources', label: 'Resources' }
];

export const loan_applications = [
  {
    id: 'ln-1',
    loanType: 'Fix & Flip Loan',
    address: '123 Maple Street, Miami, FL',
    amountRequested: 350000,
    progress: 42,
    status: 'In Progress',
    lastUpdated: '2 hours ago',
    nextStep: 'Property Information'
  },
  {
    id: 'ln-2',
    loanType: 'Rental Loan',
    address: '88 Harbor Lane, Tampa, FL',
    amountRequested: 420000,
    progress: 18,
    status: 'Draft',
    lastUpdated: '1 day ago',
    nextStep: 'Borrower Details'
  },
  {
    id: 'ln-3',
    loanType: 'Bridge Loan',
    address: '500 Ocean Drive, Miami, FL',
    amountRequested: 610000,
    progress: 100,
    status: 'Submitted',
    lastUpdated: '3 days ago',
    nextStep: 'Underwriting Review'
  },
  {
    id: 'ln-4',
    loanType: 'Fix & Flip Loan',
    address: '245 Pine Street, Orlando, FL',
    amountRequested: 290000,
    progress: 100,
    status: 'Closed',
    lastUpdated: '2 weeks ago',
    nextStep: 'Funded'
  }
];

export const conditions = [
  {
    id: 'tsk-1',
    title: 'Upload purchase contract',
    loanMeta: 'Fix & Flip Loan - 123 Maple Street, Miami, FL',
    taskType: 'Document',
    dueLabel: 'Today',
    cta: 'Upload Document',
    section: 'attention'
  },
  {
    id: 'tsk-2',
    title: 'Complete Property Information',
    loanMeta: 'Fix & Flip Loan - 123 Maple Street, Miami, FL',
    taskType: 'Application',
    dueLabel: 'Next step',
    cta: 'Continue Application',
    section: 'attention'
  },
  {
    id: 'tsk-3',
    title: 'Upload borrower government-issued ID',
    loanMeta: 'Fix & Flip Loan - 123 Maple Street, Miami, FL',
    taskType: 'Document',
    dueLabel: 'Tomorrow',
    cta: 'Upload Document',
    section: 'attention'
  },
  {
    id: 'tsk-4',
    title: 'Add property photos',
    loanMeta: 'Fix & Flip Loan - Documents',
    taskType: 'Document',
    dueLabel: '3 days',
    cta: 'View',
    section: 'coming-up'
  },
  {
    id: 'tsk-5',
    title: 'Upload contractor bid',
    loanMeta: 'Fix & Flip Loan - Documents',
    taskType: 'Document',
    dueLabel: 'Next week',
    cta: 'View',
    section: 'coming-up'
  }
];

export const recentActivity = [
  { id: 'a-1', title: 'Started loan request', subtitle: 'Uploaded ID' },
  { id: 'a-2', title: 'Completed borrower profile', subtitle: '' }
];

export const advisor = {
  name: 'Karen Mitchell',
  role: 'Loan Advisor',
  note: 'Your point of contact for questions, updates, and next steps.'
};

export const message_threads = [
  {
    id: 'thr-1',
    name: 'Brickline Advisor',
    status: 'Online',
    preview: 'You need a few documents for your DSCR Loan.',
    time: '1 min ago'
  }
];

export const messages = [
  {
    id: 'm-1',
    sender: 'user',
    body: 'What documents do I need for my DSCR Loan?',
    time: '5 mins ago'
  },
  {
    id: 'm-2',
    sender: 'advisor',
    body:
      'You need a few documents for your DSCR Loan:\n- Property Information\n- Identity Verification\n- Business Entity Docs\n- Financials\nNeed help with any of these?',
    time: '4 mins ago'
  },
  {
    id: 'm-3',
    sender: 'user',
    body: "Got it, thanks. Can you help me upload my driver's license?",
    time: '2 mins ago'
  },
  {
    id: 'm-4',
    sender: 'advisor',
    body: "No problem! Please upload a clear photo of the front and back of your driver's license.",
    time: 'Just now',
    cta: "Upload Driver's License"
  }
];
