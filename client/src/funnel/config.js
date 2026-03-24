const EXPERIENCE_STANDARD = ['none', 'one_two'];
const EXPERIENCE_PRO = ['three_four', 'five_plus'];

export const funnelConfig = {
  loanProgram: {
    step_key: 'loan_program',
    route: '/m/getRate/loanProgram',
    key: 'loan_program',
    title: 'What type of financing are you looking for?',
    options: [
      { label: 'Fix & Flip / Bridge', value: 'fix_flip' },
      { label: 'New Construction', value: 'new_construction' },
      { label: 'Rental', value: 'rental' },
      { label: 'Not sure yet', value: 'unsure' }
    ],
    next: 'dealsLast24'
  },

  dealsLast24: {
    step_key: 'deals_last_24',
    route: '/m/getRate/dealsLast24',
    key: 'deals_last_24',
    title: 'How many completed deals in the last 24 months?',
    options: [
      { label: 'None', value: 'none' },
      { label: '1-2 properties', value: 'one_two' },
      { label: '3-4 properties', value: 'three_four' },
      { label: '5+ properties', value: 'five_plus' }
    ],
    next: 'propertyState'
  },

  propertyState: {
    step_key: 'property_state',
    route: '/m/getRate/propertyState',
    key: 'property_state',
    title: 'Which state is your property located in?',
    type: 'select',
    next: 'emailCapture'
  },

  emailCapture: {
    step_key: 'email_capture',
    route: '/m/getRate/emailCapture',
    key: 'email',
    title: 'Create your Brickline account to view your financing path and continue your application',
    type: 'input',
    inputType: 'email',
    next: 'phoneNumber'
  },

  phoneNumber: {
    step_key: 'phone_number',
    route: '/m/getRate/phoneNumber',
    key: 'phone',
    title: 'What is your phone number?',
    type: 'input',
    inputType: 'tel',
    next: 'fullName'
  },

  fullName: {
    step_key: 'full_name',
    route: '/m/getRate/fullName',
    title: 'What is your name?',
    type: 'name',
    next: ({ isAuthenticated, answers }) => (
      isAuthenticated ? getEntityStepByExperience(answers) : 'accountCreationFlow'
    )
  },

  accountCreationFlow: {
    step_key: 'account_creation_flow',
    route: '/check-email',
    title: 'Check your email',
    description: "We've sent you a secure link to continue your application.",
    next: ({ answers }) => getEntityStepByExperience(answers)
  },

  standardEntityQuestion: {
    step_key: 'entity_question',
    route: '/standardBorrower/entity',
    key: 'has_entity',
    title: 'Do you hold title to your investment properties in an entity?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' }
    ],
    next: {
      yes: 'standardEntityName',
      no: 'propertyAddress'
    }
  },

  proEntityQuestion: {
    step_key: 'entity_question',
    route: '/proBorrower/entity',
    key: 'has_entity',
    title: 'Do you hold title to your investment properties in an entity?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' }
    ],
    next: {
      yes: 'proEntityName',
      no: 'propertyAddress'
    }
  },

  standardEntityName: {
    step_key: 'entity_name',
    route: '/standardBorrower/entityName',
    key: 'entity_name',
    title: 'What is your business entity name?',
    type: 'input',
    inputType: 'text',
    next: 'propertyAddress'
  },

  proEntityName: {
    step_key: 'entity_name',
    route: '/proBorrower/entityName',
    key: 'entity_name',
    title: 'What is your business entity name?',
    type: 'input',
    inputType: 'text',
    next: 'propertyAddress'
  },

  propertyAddress: {
    step_key: 'property_address',
    route: '/m/getRate/propertyAddress',
    key: 'property_address',
    title: 'What is the address of the property you would like to finance?',
    type: 'input',
    inputType: 'text',
    next: 'rateCalculator'
  },

  rateCalculator: {
    step_key: 'rate_calculator',
    route: '/rate-calculator',
    title: 'Rate Calculator',
    next: null
  }
};

function getEntityStepByExperience(answers) {
  const experience = answers?.deals_last_24;

  if (EXPERIENCE_PRO.includes(experience)) {
    return 'proEntityQuestion';
  }

  if (EXPERIENCE_STANDARD.includes(experience)) {
    return 'standardEntityQuestion';
  }

  return 'standardEntityQuestion';
}

export const funnelInitialStepId = 'loanProgram';
