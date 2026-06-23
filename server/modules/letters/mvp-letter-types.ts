import { mvpLetterTypeValues } from '../../db/schema/enums'

type MvpLetterType = (typeof mvpLetterTypeValues)[number]

type MvpLetterTypeDefinition = {
  type: MvpLetterType
  title: string
  description: string
  trigger: 'document_check' | 'guided_form'
}

export const mvpLetterTypeDefinitions: MvpLetterTypeDefinition[] = [
  {
    type: 'belege_request',
    title: 'Belege Request',
    description: 'Request supporting receipts and cost evidence for a Nebenkostenabrechnung.',
    trigger: 'document_check'
  },
  {
    type: 'nebenkosten_objection',
    title: 'Nebenkosten Objection',
    description: 'Draft an objection letter for suspicious or unclear Nebenkosten findings.',
    trigger: 'document_check'
  },
  {
    type: 'repair_request',
    title: 'Repair Request',
    description: 'Request repairs from the landlord based on a guided issue description.',
    trigger: 'guided_form'
  },
  {
    type: 'deposit_return_request',
    title: 'Deposit Return Request',
    description: 'Request full deposit return or challenge deductions after move-out.',
    trigger: 'document_check'
  },
  {
    type: 'rent_increase_objection',
    title: 'Rent Increase Objection',
    description: 'Respond to a rent increase notice with a structured objection draft.',
    trigger: 'document_check'
  }
]

export const postMvpLetterTypeCandidates = [
  {
    type: 'termination',
    title: 'Termination',
    reason: 'Useful, but not required to validate the first document-check-to-letter workflow.'
  },
  {
    type: 'custom',
    title: 'Custom',
    reason: 'Too open-ended for MVP and weakens predictable variable collection and quality control.'
  }
] as const
