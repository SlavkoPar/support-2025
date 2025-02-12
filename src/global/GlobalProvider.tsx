import React, { createContext, useContext, useReducer, Dispatch, useCallback } from "react";

import {
  IGlobalContext, ILoginUser, ROLES, GlobalActionTypes,
  ICategoryData, IQuestionData,
  IGroupData, IAnswerData,
  IRoleData, IUserData,
  IRegisterUser,
  ICat,
  IParentInfo,
  IDateAndBy,
  ICatExport
} from 'global/types'

import { globalReducer, initialGlobalState } from "global/globalReducer";

import { IAssignedAnswer, ICategory, IQuestion } from "categories/types";
import { IGroup, IAnswer } from "groups/types";
import { IRole, IUser } from 'roles/types';

import { IDBPDatabase, IDBPIndex, openDB } from 'idb' // IDBPTransaction
import { escapeRegexCharacters } from 'common/utilities'

//////////////////
// Initial data
import categoryData from './categories-questions.json';
import groupData from './groups-answers.json';
import roleData from './roles-users.json';

const GlobalContext = createContext<IGlobalContext>({} as any);
const GlobalDispatchContext = createContext<Dispatch<any>>(() => null);

interface Props {
  children: React.ReactNode
}

export const GlobalProvider: React.FC<Props> = ({ children }) => {
  // If we update globalState, form inner Provider, 
  // we reset changes, and again we use initialGlobalState
  // so, don't use globalDispatch inside of inner Provider, like Categories Provider
  const [globalState, dispatch] = useReducer(globalReducer, initialGlobalState);

  const getUser = async (nickName: string) => {
    try {
      const { dbp } = globalState;
      const user: IUser = await dbp!.get("Users", nickName);
      return user;
    }
    catch (error: any) {
      console.log(error);
      return undefined;
    }
  }

  // user can be register from RegisterForm, or as the owner during creation of Database
  // const registerUser = useCallback(async (regUser: IRegisterUser, isOwner: boolean, dbp: IDBPDatabase|null ) => {
  const registerUser = async (regUser: IRegisterUser, isOwner: boolean, dbp: IDBPDatabase | null) => {
    try {
      if (!dbp) {
        dbp = globalState.dbp;
      }
      console.log("registerUser", { regUser });
      const { nickName, name, password, email, color, confirmed } = regUser;
      const user: IUser = {
        nickName,
        name,
        words: name.toLowerCase().replaceAll('?', '').split(' '),
        password,
        level: 1,
        parentRole: isOwner ? 'OWNER' : 'VIEWER',
        role: isOwner ? ROLES.OWNER : ROLES.VIEWER,  // initialy, user is registered as WIEWER
        email,
        color,
        confirmed: isOwner ? true : confirmed,
        isDarkMode: true
      }
      if (!isOwner) {
        await dbp!.add('Users', user);
        const role = await dbp!.get('Roles', isOwner ? 'OWNER' : 'VIEWER');
        const obj: IRole = {
          ...role,
          numOfUsers: role.numOfUsers + 1,
          modified: {
            date: new Date(),
            by: {
              nickName: globalState.authUser.nickName
            }
          }
        }
        await dbp!.put('Roles', obj);
      }
      dispatch({ type: GlobalActionTypes.AUTHENTICATE, payload: { user } });
      return user;
    }
    catch (err: any) {
      console.log(err);
      dispatch({
        type: GlobalActionTypes.SET_ERROR,
        payload: {
          error: new Error(err)
        }
      });
    }
    return null;
  }
  //}, [dispatch]);


  //const signInUser = useCallback(async (loginUser: ILoginUser): Promise<any> => {
  const signInUser = async (loginUser: ILoginUser): Promise<any> => {
    try {
      console.log("signInUser", { loginUser })
      const { nickName, password } = loginUser;
      let user: IUser | undefined = await getUser(nickName);
      if (!user) {
        alert(`User ${nickName} doesn't exist in Database`)
        return null;
      }
      else {
        // auto signIn has no paswword 
        if (password && password !== user.password) {
          alert(`Pasword doesn't match with Password in Database`)
          return null;
        }
      }
      dispatch({ type: GlobalActionTypes.AUTHENTICATE, payload: { user: { ...user, confirmed: true } } })
      return true;
    }
    catch (err: any) {
      console.log(err);
      dispatch({
        type: GlobalActionTypes.SET_ERROR,
        payload: {
          error: new Error(err)
        }
      });
    }
    return null;
  }
  //}, [dispatch]);



  const addRole = async (
    dbp: IDBPDatabase,
    //tx: IDBPTransaction<unknown, string[], "readwrite">, 
    roleData: IRoleData,
    parentRole: string,
    level: number)
    : Promise<void> => {
    const { title, roles, users } = roleData;

    const r: IRole = {
      title,
      parentRole,
      hasSubRoles: roles ? roles.length > 0 : false,
      //title: title,
      level,
      users: [],
      numOfUsers: users?.length || 0,
      created: {
        date: new Date(),
        by: {
          nickName: 'Boss'
        }
      },
    }
    await dbp.add('Roles', r);
    console.log('group added', r);

    if (users) {
      let i = 0;
      while (i < users.length) {
        const u: IUserData = users[i];
        const { nickName, name, password, email, color } = u;
        const user: IUser = {
          nickName,
          parentRole: r.title,
          role: r.title as ROLES,
          name,
          words: name.toLowerCase().replaceAll('?', '').split(' '),
          password,
          email,
          color,
          level: 2,
          confirmed: false,
          isDarkMode: true
        }
        await dbp.add('Users', user);
        i++;
      }
    }

    if (roles) {
      const parentGroup = r.title;
      let j = 0;
      const parentRoles = roles;
      while (j < parentRoles.length) {
        addRole(dbp, parentRoles[j], parentRole, level + 1);
        j++;
      }
    }
    Promise.resolve();
  }

  const addGroup = async (
    dbp: IDBPDatabase,
    //tx: IDBPTransaction<unknown, string[], "readwrite">, 
    groupData: IGroupData,
    parentGroup: string,
    level: number)
    : Promise<void> => {
    const { id, title, groups, answers } = groupData;
    const g: IGroup = {
      id,
      parentGroup,
      hasSubGroups: groups ? groups.length > 0 : false,
      title,
      level,
      answers: [],
      numOfAnswers: answers?.length || 0,
      created: {
        date: new Date(),
        by: {
          nickName: 'Boss'
        }
      },
    }
    await dbp.add('Groups', g);
    console.log('--->group added', g);

    if (answers) {
      let i = 0;
      while (i < answers.length) {
        const a: IAnswerData = answers[i];
        const { title, source, status } = a;
        // TODO remove spec chars 
        // const escapedValue = escapeRegexCharacters(a.title.trim());
        // if (escapedValue === '') {
        // }
        const words: string[] = a.title.toLowerCase().replaceAll('?', '').split(' ').map((s: string) => s.trim());
        const answer: IAnswer = {
          parentGroup: g.id,
          title,
          words: words.filter(w => w.length > 1),
          source: source ?? 0,
          status: status ?? 0,
          level: 2
        }
        console.log('========>>>>>>', { answer })
        await dbp.add('Answers', answer);
        i++;
      }
    }

    if (groups) {
      const parentGroup = g.id;
      let j = 0;
      const parentGroups = groups;
      while (j < parentGroups.length) {
        addGroup(dbp, parentGroups[j], parentGroup, level + 1);
        j++;
      }
    }
    Promise.resolve();
  }

  const addCategory = async (
    dbp: IDBPDatabase,
    //tx: IDBPTransaction<unknown, string[], "readwrite">, 
    categoryData: ICategoryData,
    parentCategory: string,
    level: number)
    : Promise<void> => {
    try {
      const { id, title, kind, variations, categories, questions } = categoryData;

      if (id === 'SAFARI') {
        const q = {
          title: '',
          source: 0,
          status: 0,
        }
        for (var i = 999; i > 100; i--) {
          questions!.push({ ...q, title: 'This is demo question related to test of infinite scroll, when Group has a few hundreds of questions ' + i });
        }
      }

      const cat: ICategory = {
        id,
        kind: kind ?? 0,
        parentCategory,
        hasSubCategories: categories ? categories.length > 0 : false,
        title,
        // words: title.toLowerCase().replaceAll('?', '').split(' ').map((s: string) => s.trim()).filter(w => w.length > 1),
        level,
        variations: variations ?? [],
        questions: [],
        numOfQuestions: questions?.length || 0,
        created: {
          date: new Date(),
          by: {
            nickName: 'Boss'
          }
        },
      }
      await dbp.add('Categories', cat);
      console.log('category added', cat);

      try {
        if (questions) {
          let assAnswers: IAssignedAnswer[] = [];
          let i = 0;
          while (i < questions.length) {
            const q: IQuestionData = questions[i];
            const { title, source, status, assignedAnswers } = q;
            if (assignedAnswers) {
              assAnswers = assignedAnswers.map(id => ({
                answer: {
                  id
                },
                user: {
                  nickName: 'OWNER',
                  createdBy: 'OWNER'
                },
                assigned: {
                  date: new Date(),
                  by: {
                    nickName: globalState.authUser.nickName
                  }
                }
              }))
            }
            // TODO
            const words = q.title.toLowerCase().replaceAll('?', '').split(' ').map((s: string) => s.trim());
            const question: IQuestion = {
              parentCategory: cat.id,
              title,
              words: words.filter(w => w.length > 1),
              source: source ?? 0,
              status: status ?? 0,
              assignedAnswers: assAnswers,
              numOfAssignedAnswers: 0,
              level: 2,
              variations: q.variations ?? []
            }
            console.log('-->>>', { question })
            await dbp.add('Questions', question);
            i++;
          }
        }
      } catch (err) {
        console.error(err)
      }

      if (categories) {
        const parentCategory = cat.id;
        // const categoryDatas = categories;
        let j = 0;
        while (j < categories.length) {
          const categoryData = categories[j];
          console.error({ categoryData })
          addCategory(dbp, categoryData, parentCategory, level + 1);
          j++;
        }
      }
    }
    catch (error) {
      console.error(error);
    }
    Promise.resolve();
  }

  const addInitialData = async (dbp: IDBPDatabase): Promise<void> => {
    //new Promise<void>(async (resolve) => {
    // Categries -> Questions
    try {
      let level = 1;
      let i = 0;
      const data: ICategoryData[] = categoryData;
      const tx = dbp.transaction(['Categories', 'Questions'], 'readwrite');
      while (i < data.length) {
        await addCategory(dbp, data[i], 'null', level);
        i++;
      }
      console.log('trans categories complete')
      // dispatch({ type: GlobalActionTypes.SET_DBP, payload: { dbp } })
      await tx.done;
    }
    catch (err) {
      console.log('error', err);
    }

    // Groups -> Answers
    try {
      let level = 1;
      let i = 0;
      const data: IGroupData[] = groupData;
      const tx = dbp.transaction(['Groups', 'Answers'], 'readwrite');
      while (i < data.length) {
        await addGroup(dbp, data[i], 'null', level);
        i++;
      }
      console.log('trans groups complete')
      // dispatch({ type: GlobalActionTypes.SET_DBP, payload: { dbp } })
      await tx.done;
    }
    catch (err) {
      console.log('error', err);
    }

    // Roles -> Users
    try {
      let level = 1;
      let i = 0;
      const data: IRoleData[] = roleData;
      const tx = dbp.transaction(['Roles', 'Users'], 'readwrite');
      while (i < data.length) {
        await addRole(dbp, data[i], 'null', level);
        i++;
      }
      console.log('trans groups complete')
      // dispatch({ type: GlobalActionTypes.SET_DBP, payload: { dbp } })
      await tx.done;
      // resolve
      //resolve();
    }
    catch (err) {
      console.log('error', err);
    }
    //})
  }

  const loadAllCategories = useCallback(async (dbp: IDBPDatabase): Promise<any> => {
    try {
      const tx = dbp.transaction('Categories');
      const allCategories: Map<string, ICat> = new Map<string, ICat>();
      for await (const cursor of tx.store.iterate()) {
        let category: ICategory = cursor.value;
        const { id, parentCategory, title, variations, hasSubCategories, kind } = category;
        const cat: ICat = {
          id,
          parentCategory,
          title,
          words: title.toLowerCase().replaceAll('?', '').split(' ').map((s: string) => s.trim()).filter(w => w.length > 1),
          titlesUpTheTree: '',
          variations,
          hasSubCategories,
          kind
        }
        allCategories.set(id, cat);
      }
      await tx.done;

      let values = allCategories.values();
      while (true) {
        let result = values.next();
        if (result.done) break;
        let cat = result.value as unknown as ICat;
        let titlesUpTheTree = cat.id;
        let cat2 = cat;
        while (cat2.parentCategory !== 'null') {
          cat2 = allCategories.get(cat2.parentCategory)!;
          titlesUpTheTree = cat2!.id + ' / ' + titlesUpTheTree;
        }
        cat.titlesUpTheTree = titlesUpTheTree;
      }
      dispatch({ type: GlobalActionTypes.SET_ALL_CATEGORIES, payload: { allCategories } });
    }
    catch (error: any) {
      console.log(error)
      dispatch({ type: GlobalActionTypes.SET_ERROR, payload: { error } });
    }
  }, [dispatch]);

  const OpenDB = useCallback(async (): Promise<any> => {
    try {
      let initializeData = false;
      const dbp = await openDB('SupportKnowledge', 1, {
        upgrade(db, oldVersion, newVersion, transaction, event) {
          //console.error('Error loading database.');

          // Categories
          const store = db.createObjectStore('Categories', { keyPath: 'id' });
          store.createIndex('title_idx', 'title', { unique: true });
          store.createIndex('parentCategory_idx', 'parentCategory', { unique: false });

          // Questions
          const questionsStore = db.createObjectStore('Questions', { autoIncrement: true });
          questionsStore.createIndex('words_idx', 'words', { multiEntry: true, unique: false });
          questionsStore.createIndex('parentCategory_title_idx', ['parentCategory', 'title'], { unique: true });
          questionsStore.createIndex('parentCategory_idx', 'parentCategory', { unique: false });

          // Groups
          const groupStore = db.createObjectStore('Groups', { keyPath: 'id' });
          groupStore.createIndex('title_idx', 'title', { unique: true });
          groupStore.createIndex('parentGroup_idx', 'parentGroup', { unique: false });

          // Answers
          const answerStore = db.createObjectStore('Answers', { autoIncrement: true });
          answerStore.createIndex('words_idx', 'words', { multiEntry: true, unique: false });
          answerStore.createIndex('parentGroup_title_idx', ['parentGroup', 'title'], { unique: true });
          answerStore.createIndex('parentGroup_idx', 'parentGroup', { unique: false });

          // Roles
          const roleStore = db.createObjectStore('Roles', { keyPath: 'title' });
          roleStore.createIndex('title_idx', 'title', { unique: true });
          roleStore.createIndex('parentRole_idx', 'parentRole', { unique: false });

          // Users
          const userStore = db.createObjectStore('Users', { keyPath: 'nickName' });
          groupStore.createIndex('nickName_idx', 'nickName', { unique: true });
          userStore.createIndex('words_idx', 'words', { multiEntry: true, unique: false });
          userStore.createIndex('parentRole_nickName_idx', ['parentRole', 'nickName'], { unique: true });
          userStore.createIndex('parentRole_idx', 'parentRole', { unique: false });

          initializeData = true;
        },
        terminated() {
          alert('terminated')
        }
      });
      // Add initial data
      if (initializeData) {
        await addInitialData(dbp);
        const userData: IUserData = roleData[0].users![0];
        const { nickName, name, password, email } = userData;
        const regUser: IRegisterUser = { ...userData, level: 1, confirmed: false }
        await registerUser(regUser, true, dbp);
      }
      await loadAllCategories(dbp);
      await dispatch({ type: GlobalActionTypes.SET_DBP, payload: { dbp } });
      // else {
      //   signInUser({nickName: 'Boss', password: 'Boss12345'})
      // }
      // This event handles the event whereby a new version of the database needs to be created
      // Either one has not been created before, or a new version number has been submitted via the
      // window.indexedDB.open line above
      //it is only implemented in recent browsers
      return true;
    }
    catch (err: any) {
      console.log(err);
      dispatch({
        type: GlobalActionTypes.SET_ERROR,
        payload: {
          error: new Error("")
        }
      });
      return false;
    }
  }, []);

  const joinAssignedAnswers = async (assignedAnswers: IAssignedAnswer[]): Promise<IAssignedAnswer[]> => {
    const arr: IAssignedAnswer[] = [];
    try {
      const { dbp } = globalState;
      // join answer.title
      let i = 0;
      while (i < assignedAnswers.length) {
        const assignedAnswer = assignedAnswers[i];
        const answer: IAnswer = await dbp!.get("Answers", assignedAnswer.answer.id);
        const title = answer ? answer.title : "Answer doesn't exist any more";
        arr.push({ ...assignedAnswer, answer: { ...assignedAnswer.answer, title } });
        i++;
      }
    }
    catch (error: any) {
      console.log(error);
      dispatch({ type: GlobalActionTypes.SET_ERROR, payload: error });
    }
    return arr;
  }

  const getQuestion = async (id: number): Promise<IQuestion | undefined> => {
    try {
      const { dbp } = globalState;
      const question: IQuestion = await dbp!.get("Questions", id);
      const { parentCategory } = question;
      const category: ICategory = await dbp!.get("Categories", parentCategory)
      question.id = id;
      question.categoryTitle = category.title;
      return question;
    }
    catch (error: any) {
      console.log(error);
      dispatch({ type: GlobalActionTypes.SET_ERROR, payload: error });
    }
    return undefined
  }


  const getCatsByKind = async (kind: number): Promise<ICat[]> => {
    try {
      const { allCategories } = globalState;
      const cats: ICat[] = [];
      allCategories.forEach((c, id) => {
        if (c.kind === kind) {
          const cat: ICat = {
            id,
            title: c.title,
            words: [],
            parentCategory: "",
            titlesUpTheTree: "",
            variations: [],
            hasSubCategories: false,
            kind
          }
          cats.push(cat);
        }
      })
      return cats;
    }
    catch (error: any) {
      console.log(error)
      dispatch({ type: GlobalActionTypes.SET_ERROR, payload: { error } });
    }
    return [];
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // Select Category
  // TOD mozda ne mora iz baze
  const getSubCats = async ({ parentCategory, level }: IParentInfo): Promise<any> => {
    try {
      const { dbp } = globalState;
      const tx = dbp!.transaction('Categories')
      const index = tx.store.index('parentCategory_idx');
      const list: ICategory[] = [];
      for await (const cursor of index.iterate(parentCategory)) {
        console.log(cursor.value);
        list.push(cursor.value)
      }
      await tx.done;
      const subCats = list.map((c: ICategory) => ({
        ...c,
        questions: [],
        isExpanded: false
      }))
      return subCats;


      // const url = `/api/categories/${wsId}-${parentCategory}`
      // const res = await axios.get(url)
      // const { status, data } = res;
      // if (status === 200) {
      //   const subCategories = data.map((c: ICategory) => ({
      //     ...c,
      //     questions: [],
      //     isExpanded: false
      //   }))
      //   return subCategories;
      // }
      // else {
      //   console.log('Status is not 200', status)
      //   dispatch({
      //     type: ActionTypes.SET_ERROR,
      //     payload: { error: new Error('Status is not 200 status:' + status) }
      //   });
      // }
    }
    catch (err: any | Error) {
      console.log(err);
      dispatch({ type: GlobalActionTypes.SET_ERROR, payload: { error: err } });
    }
  }

  const exportToObj = async (index: IDBPIndex<unknown, ["Categories"], "Categories", "parentCategory_idx", "readonly">,
    category: ICategory) => {
    try {
      category.categories = [];
      for await (const cursor of index.iterate(category.id)) {
        const cat: ICategory = cursor.value;
        await exportToObj(index, cat);
        category.categories.push(cat);
      }
    }
    catch (error: any | Error) {
      console.log(error);
      dispatch({ type: GlobalActionTypes.SET_ERROR, payload: { error } });
    }
  }

  const exportToJSON = async (category: ICategory) => {
    try {
      const { dbp } = globalState;
      const tx = dbp!.transaction('Categories')
      const index = tx.store.index('parentCategory_idx');
      await exportToObj(index, category);
      await tx.done;
    }
    catch (error: any | Error) {
      console.log(error);
      dispatch({ type: GlobalActionTypes.SET_ERROR, payload: { error } });
    }
  }

  const health = () => {
    const url = `api/health`;
    // axios
    //   .post(url)
    //   .then(({ status }) => {
    //     if (status === 200) {
    //       console.log('health successfull:', status)
    //     }
    //     else {
    //       console.log('Status is not 200', status)
    //     }
    //   })
    //   .catch((err: any | Error) => {
    //     console.log(err);
    //   });
  };

  const getAnswer = async (id: number): Promise<IAnswer | undefined> => {
    try {
      const { dbp } = globalState;
      const answer: IAnswer = await dbp!.get("Answers", id);
      const { parentGroup } = answer;
      const group: IGroup = await dbp!.get("Groups", parentGroup)
      answer.id = id;
      answer.groupTitle = group.title;
      return answer;
    }
    catch (error: any) {
      console.log(error);
    }
    return undefined;
  };



  return (
    <GlobalContext.Provider value={{
      globalState, OpenDB, loadAllCategories, registerUser, signInUser, getUser, exportToJSON, health,
      getSubCats, getCatsByKind, getQuestion, joinAssignedAnswers, getAnswer
    }}>
      <GlobalDispatchContext.Provider value={dispatch}>
        {children}
      </GlobalDispatchContext.Provider>
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  return useContext(GlobalContext);
}

export const useGlobalDispatch = () => {
  return useContext(GlobalDispatchContext)
};

export const useGlobalState = () => {
  const { globalState } = useGlobalContext()
  return globalState;
}
