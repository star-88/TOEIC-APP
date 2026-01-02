export interface Word {
  id: string;
  term: string;
  meaning: string;
  example: string;
  group: string;
  createdAt: number;
}

export interface GrammarNote {
  id: string;
  title: string;
  content: string;
  lastEdited: number;
}

export type ViewState = 
  | 'GROUPS' 
  | 'GROUP_DETAIL' 
  | 'ADD_WORD' 
  | 'WORD_DETAIL'
  | 'GRAMMAR_LIST'
  | 'GRAMMAR_EDIT';

export interface AISuggestion {
  meaning: string;
  example: string;
}
