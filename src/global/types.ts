// Define the Global State
import { IAssignedAnswer, ICategory, IQuestion } from 'categories/types';
import { IOption } from 'common/types';
import { IAnswer } from 'groups/types';
import { IDBPDatabase } from 'idb';
import { IUser } from 'roles/types';

export interface IDateAndBy {
	date: Date,
	by: {
		nickName: string
	}
}

export interface IRecord {
	created?: IDateAndBy,
	createdBy?: string,
	modified?: IDateAndBy,
	modifiedBy?: string,
	inViewing?: boolean,
	inEditing?: boolean,
	inAdding?: boolean,
	archived: boolean
}


export interface IAuthUser {
	color?: string,
	nickName: string,
	name: string;
	password: string,
	email: string,
	role: ROLES,
	registrationConfirmed: boolean,
	registered?: Date,
	visited?: Date
}

// export const ROLES: Map<string, string> = new Map<string, string>([
// 	['OWNER', 'OWNER'],
// 	['ADMIN', 'ADMIN'],
// 	['EDITOR', 'EDITOR'],
// 	['VIEWER', 'VIEWER']
// ])

export enum ROLES {
	OWNER = 'OWNER',
	ADMIN = 'ADMIN',
	EDITOR = 'EDITOR',
	VIEWER = 'VIEWER'
}

export interface ICat {
	id: string;
	parentCategory: string; // | null is a valid value so you can store data with null value in indexeddb 
	// but it is not a valid key
	title: string;
	words: string[];
	titlesUpTheTree: string; // traverse up the tree, until root
	variations: string[];
	hasSubCategories: boolean;
	kind: number
}

export interface ICatExport {
	id: string;
	parentCategory: string;
	title: string;
	variations: string[];
	hasSubCategories: boolean;
	kind: number
}


export interface IGlobalState {
	isAuthenticated: boolean | null;
	dbp: IDBPDatabase | null;
	everLoggedIn: boolean;
	authUser: IAuthUser;
	canEdit: boolean,
	isOwner: boolean,
	isDarkMode: boolean;
	variant: string,
	bg: string,
	loading: boolean;
	error?: Error;
	allCategories: Map<string, ICat>;
}

export interface IGlobalStateFromLocalStorage {
	nickName: string;
	everLoggedIn: boolean;
	isDarkMode: boolean;
	variant: string;
	bg: string;
}

export interface IParentInfo {
	parentCategory: string,
	title?: string, // to easier follow getting the list of sub-categories
	level: number
}


export interface IGlobalContext {
	globalState: IGlobalState;
	getUser: (nickName: string) => Promise<any>;
	registerUser: (regUser: IRegisterUser, isOwner: boolean, dbp: IDBPDatabase | null) => Promise<any>;
	signInUser: (loginUser: ILoginUser) => Promise<any>;
	OpenDB: () => Promise<any>;
	loadAllCategories: (dbp: IDBPDatabase) => void;
	exportToJSON: (category: ICategory, parentCategory: string) => void;
	health: () => void;
	getSubCats: ({ parentCategory, level }: IParentInfo) => Promise<any>;
	getCatsByKind: (kind: number) => Promise<ICat[]>;
	getQuestion: (id: number) => Promise<IQuestion | undefined>;
	joinAssignedAnswers: (assignedAnswers: IAssignedAnswer[]) => Promise<IAssignedAnswer[]>;
	getAnswer: (id: number) => Promise<IAnswer | undefined>;
	getMaxConversation: (dbp: IDBPDatabase) => Promise<number>;
	addHistory: (dbp: IDBPDatabase | null, history: IHistory) => Promise<void>;
	getAnswersRated: (dbp: IDBPDatabase | null, questionId: number) => Promise<IAnswerRating[]>;
}

export enum GlobalActionTypes {
	SET_LOADING = 'SET_LOADING',
	AUTHENTICATE = "AUTHENTICATE",
	UN_AUTHENTICATE = "UN_AUTHENTICATE",
	SET_DBP = "SET_DBP",
	SET_ERROR = 'SET_ERROR',
	DARK_MODE = "DARK_MODE",
	LIGHT_MODE = "LIGHT_MODE",
	SET_REGISTRATION_CONFIRMED = 'SET_REGISTRATION_CONFIRMED',
	SET_ALL_CATEGORIES = 'SET_ALL_CATEGORIES',
	SET_QUESTION_AFTER_ASSIGN_ANSWER = 'SET_QUESTION_AFTER_ASSIGN_ANSWER',
}

export interface ILoginUser {
	nickName: string;
	password?: string;
	who?: string;
}

export interface IRegisterUser {
	who?: string,
	nickName: string,
	name: string,
	password: string,
	email: string,
	color: string,
	level: number,
	confirmed: boolean
}

export interface IJoinToWorkspace {
	invitationId: string,
	userName: string;
	password: string;
	date?: Date;
}


export type ActionMap<M extends Record<string, any>> = {
	[Key in keyof M]: M[Key] extends undefined
	? {
		type: Key;
	}
	: {
		type: Key;
		payload: M[Key];
	}
};

export type GlobalPayload = {
	[GlobalActionTypes.SET_LOADING]: {
	};

	[GlobalActionTypes.AUTHENTICATE]: {
		user: IUser
	};

	[GlobalActionTypes.UN_AUTHENTICATE]: undefined;

	[GlobalActionTypes.SET_DBP]: {
		dbp: IDBPDatabase
	};

	[GlobalActionTypes.SET_ERROR]: {
		error: Error;
	};

	[GlobalActionTypes.LIGHT_MODE]: undefined;

	[GlobalActionTypes.DARK_MODE]: undefined;

	[GlobalActionTypes.SET_REGISTRATION_CONFIRMED]: undefined;

	[GlobalActionTypes.SET_ALL_CATEGORIES]: {
		allCategories: Map<string, ICat>
	};

	[GlobalActionTypes.SET_QUESTION_AFTER_ASSIGN_ANSWER]: {
		question: IQuestion
	};
};


/////////////////////////////////////////////////////////////////////////
// DropDown Select Category

export interface ICatsState {
	loading: boolean,
	parentCategory: IDBValidKey | null,
	title: string,
	cats: ICategory[], // drop down categories
	error?: Error;
}

export interface ICatInfo {
	parentCategory: string,
	level: number,
	setParentCategory: (category: ICategory) => void;
}

export enum CatsActionTypes {
	SET_LOADING = 'SET_LOADING',
	SET_SUB_CATS = 'SET_SUB_CATS',
	SET_ERROR = 'SET_ERROR',
	SET_EXPANDED = 'SET_EXPANDED',
	SET_PARENT_CATEGORY = 'SET_PARENT_CATEGORY'
}

export type CatsPayload = {
	[CatsActionTypes.SET_LOADING]: undefined;

	[CatsActionTypes.SET_SUB_CATS]: {
		subCats: ICategory[];
	};

	[CatsActionTypes.SET_EXPANDED]: {
		id: string;
		expanding: boolean;
	}

	[CatsActionTypes.SET_ERROR]: {
		error: Error;
	};

	[CatsActionTypes.SET_PARENT_CATEGORY]: {
		category: ICategory;
	};

};

export type CatsActions =
	ActionMap<CatsPayload>[keyof ActionMap<CatsPayload>];


////////////////////////
// Category -> questions
export interface IQuestionData {
	title: string;
	assignedAnswers?: number[];
	source?: number;
	status?: number;
	variations?: string[]
}

export interface ICategoryData {
	id: string;
	title: string;
	kind?: number;
	variations?: string[];
	categories?: ICategoryData[],
	questions?: IQuestionData[]
}

////////////////////
// Group -> answers
export interface IAnswerData {
	title: string;
	source?: number;
	status?: number;
}

export interface IGroupData {
	id: string,
	title: string,
	groups?: IGroupData[],
	answers?: IAnswerData[]
}

////////////////////
// Role -> users
export interface IUserData {
	nickName: string;
	name: string;
	password: string;
	email: string;
	color: string;
}

export interface IRoleData {
	title: string,
	roles?: IRoleData[],
	users?: IUserData[]
}


export interface IHistory {
	conversation?: number;
	client: string;
	questionId: number;
	answerId: number;
	fixed: boolean | undefined; // when client didn't click on 'Fixed' or 'Not fixed' buttons
	created: Date
}

export interface IHistoryData {
	client: string;
	questionId: number;
	answerId: number;
	created?: Date
}

export interface IAnswerRating {
	answerId?: number;
	fixed: number;
	notFixed: number; // client clicked on 'Not fixed' button
	Undefined: number; // not clicked
}


export type GlobalActions = ActionMap<GlobalPayload>[keyof ActionMap<GlobalPayload>];