import { ActionMap, IDateAndBy, IRecord } from 'global/types';
import { IAnswer } from 'groups/types';

export const Mode = {
	UNDEFINED: undefined,
	NULL: null,
	AddingCategory: 'AddingCategory',
	ViewingCategory: 'ViewingCategory',
	EditingCategory: 'EditingCategory',
	DeletingCategory: 'DeletingCategory',

	// tags
	AddingVariation: 'AddingVariation',
	EditingVariation: 'EditingVariation',
	ViewingVariation: 'ViewingVariation',

	//////////////////////////////////////
	// questions
	AddingQuestion: 'AddingQuestion',
	ViewingQuestion: 'ViewingQuestion',
	EditingQuestion: 'EditingQuestion',
	DeletingQuestion: 'DeletingQuestion',
}

export enum FormMode {
	viewing,
	adding,
	editing
}

// export interface IQuestionAnswer {
// 	categoryId: string;
// 	questionId: number;
// 	id: number,
// 	answer: {
// 		id: number,
// 		title: string
// 	},
// 	user: {
// 		id?: number,
// 		createdBy: string
// 	}
// 	assigned: IDateAndBy
// }

export interface IAssignedAnswer {
	answer: {
		id: number,
		title?: string
	}
	user: {
		nickName: string,
		createdBy: string
	}
	assigned: IDateAndBy
}

export interface IFromUserAssignedAnswer {
	id: string,
	createdBy: string
}

export interface IQuestion extends IRecord {
	id?: number;
	title: string;
	words?: string[];
	level: number;
	parentCategory: string;
	categoryTitle?: string;
	assignedAnswers: IAssignedAnswer[];
	numOfAssignedAnswers: number;
	source: number;
	status: number;
	fromUserAssignedAnswer?: IFromUserAssignedAnswer[];
	variations: string[];
	included?: boolean;
}

export interface IVariation {
	name: string;
}


export interface ICategory extends IRecord {
	id: string;
	kind: number;
	parentCategory: string; // | null is a valid value so you can store data with null value in indexeddb 
	// but it is not a valid key
	title: string;
	// words: string[];
	level: number;
	variations: string[];
	questions: IQuestion[];
	numOfQuestions: number;
	hasMore?: boolean;
	isExpanded?: boolean;
	hasSubCategories: boolean;
	categories?: ICategory[]; // used for export to json
}


export interface ICategoryInfo {
	id: string,
	level: number
}


export interface IParentInfo {
	parentCategory: string,
	level: number,
	title?: string, // to easier follow getting the list of sub-categories
	inAdding?: boolean,
	startCursor?: number,
	includeQuestionId?: number
}


export interface ICategoriesState {
	mode: string | null;
	categories: ICategory[];
	currentCategoryExpanded: string;
	lastCategoryExpanded: string | null;
	categoryId_questionId_done: string | null;
	parentNodes: IParentCategories;
	loading: boolean;
	questionLoading: boolean,
	error?: Error;
}

export interface ICategoriesContext {
	state: ICategoriesState,
	reloadCategoryNode: (categoryId: string, questionId: string | null) => Promise<any>;
	getSubCategories: ({ parentCategory, level }: IParentInfo) => void,
	createCategory: (category: ICategory) => void,
	viewCategory: (id: string) => void,
	editCategory: (id: string) => void,
	updateCategory: (category: ICategory, closeForm: boolean) => void,
	deleteCategory: (id: string) => void,
	deleteCategoryVariation: (id: string, name: string) => void,
	expandCategory: (category: ICategory, expand: boolean) => void,
	//////////////
	// questions
	//getCategoryQuestions: ({ parentCategory, level, inAdding }: IParentInfo) => void,
	loadCategoryQuestions: ({ parentCategory }: IParentInfo) => void,
	createQuestion: (question: IQuestion, fromModal: boolean) => Promise<any>;
	viewQuestion: (id: number) => void;
	editQuestion: (id: number) => void;
	updateQuestion: (question: IQuestion) => Promise<any>;
	assignQuestionAnswer: (questionId: number, answerId: number, assigned: IDateAndBy) => Promise<any>;
	unAssignQuestionAnswer: (questionId: number, answerId: number) => Promise<any>;
	createAnswer: (answer: IAnswer) => Promise<any>;
	deleteQuestion: (id: number, parentCategory: string) => void;
}

export interface ICategoryFormProps {
	inLine: boolean;
	category: ICategory;
	mode: FormMode;
	submitForm: (category: ICategory) => void,
	children: string
}

export interface IQuestionFormProps {
	question: IQuestion;
	mode: FormMode;
	closeModal?: () => void;
	submitForm: (question: IQuestion) => void,
	showCloseButton: boolean;
	source: number,
	children: string
}

export interface IParentCategories {
	categoryId: string | null;
	questionId: string | null;
	parentNodesIds: string[] | null;
}


export enum ActionTypes {
	SET_LOADING = 'SET_LOADING',
	SET_CATEGORY_LOADING = 'SET_CATEGORY_LOADING',
	SET_CATEGORY_QUESTIONS_LOADING = 'SET_CATEGORY_QUESTIONS_LOADING',
	SET_SUB_CATEGORIES = 'SET_SUB_CATEGORIES',
	CLEAN_SUB_TREE = 'CLEAN_SUB_TREE',
	CLEAN_TREE = 'CLEAN_TREE',
	SET_ERROR = 'SET_ERROR',
	ADD_SUB_CATEGORY = 'ADD_SUB_CATEGORY',
	SET_CATEGORY = 'SET_CATEGORY',
	SET_ADDED_CATEGORY = 'SET_ADDED_CATEGORY',
	VIEW_CATEGORY = 'VIEW_CATEGORY',
	EDIT_CATEGORY = 'EDIT_CATEGORY',
	DELETE = 'DELETE',

	CLOSE_CATEGORY_FORM = 'CLOSE_CATEGORY_FORM',
	CANCEL_CATEGORY_FORM = 'CANCEL_CATEGORY_FORM',
	SET_EXPANDED = 'SET_EXPANDED',

	SET_PARENT_CATEGORIES = "SET_PARENT_CATEGORIES",

	// questions
	LOAD_CATEGORY_QUESTIONS = 'LOAD_CATEGORY_QUESTIONS',
	ADD_QUESTION = 'ADD_QUESTION',
	VIEW_QUESTION = 'VIEW_QUESTION',
	EDIT_QUESTION = 'EDIT_QUESTION',

	SET_QUESTION = 'SET_QUESTION',
	SET_QUESTION_AFTER_ASSIGN_ANSWER = 'SET_QUESTION_AFTER_ASSIGN_ANSWER',
	SET_QUESTION_ANSWERS = 'SET_QUESTION_ANSWERS',
	DELETE_QUESTION = 'DELETE_QUESTION',

	CLOSE_QUESTION_FORM = 'CLOSE_QUESTION_FORM',
	CANCEL_QUESTION_FORM = 'CANCEL_QUESTION_FORM'
}

export type CategoriesPayload = {
	[ActionTypes.SET_LOADING]: undefined;

	[ActionTypes.SET_CATEGORY_LOADING]: {
		id: string;
		loading: boolean;
	}

	[ActionTypes.SET_CATEGORY_QUESTIONS_LOADING]: {
		questionLoading: boolean;
	}


	[ActionTypes.SET_PARENT_CATEGORIES]: {
		parentNodes: IParentCategories
	};

	[ActionTypes.SET_SUB_CATEGORIES]: {
		subCategories: ICategory[];
	};

	[ActionTypes.ADD_SUB_CATEGORY]: IParentInfo;

	[ActionTypes.VIEW_CATEGORY]: {
		category: ICategory;
	};

	[ActionTypes.EDIT_CATEGORY]: {
		category: ICategory;
	};

	[ActionTypes.SET_CATEGORY]: {
		category: ICategory;
	};

	[ActionTypes.SET_ADDED_CATEGORY]: {
		category: ICategory;
	};

	[ActionTypes.DELETE]: {
		id: string;
	};

	[ActionTypes.CLEAN_SUB_TREE]: {
		category: ICategory;
	};

	[ActionTypes.CLEAN_TREE]: undefined;

	[ActionTypes.CLOSE_CATEGORY_FORM]: undefined;

	[ActionTypes.CANCEL_CATEGORY_FORM]: undefined;

	[ActionTypes.SET_EXPANDED]: {
		id: string;
		expanding: boolean;
	}

	[ActionTypes.SET_ERROR]: {
		error: Error;
	};

	/////////////
	// questions
	[ActionTypes.LOAD_CATEGORY_QUESTIONS]: {
		parentCategory: string,
		questions: IQuestion[],
		hasMore: boolean
	};

	[ActionTypes.ADD_QUESTION]: {
		categoryInfo: ICategoryInfo;
	}

	[ActionTypes.VIEW_QUESTION]: {
		question: IQuestion;
	};

	[ActionTypes.EDIT_QUESTION]: {
		question: IQuestion;
	};

	[ActionTypes.SET_QUESTION]: {
		question: IQuestion
	};

	[ActionTypes.SET_QUESTION_AFTER_ASSIGN_ANSWER]: {
		question: IQuestion
	};

	[ActionTypes.SET_QUESTION_ANSWERS]: {
		answers: IAssignedAnswer[];
	};

	[ActionTypes.DELETE_QUESTION]: {
		id: number;
		parentCategory: string
	};

	[ActionTypes.CLOSE_QUESTION_FORM]: {
		question: IQuestion;
	};

	[ActionTypes.CANCEL_QUESTION_FORM]: {
		question: IQuestion;
	};

};

export type CategoriesActions =
	ActionMap<CategoriesPayload>[keyof ActionMap<CategoriesPayload>];

