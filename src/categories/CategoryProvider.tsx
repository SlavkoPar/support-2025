import { useGlobalState } from 'global/GlobalProvider'
import React, { createContext, useContext, useReducer, useCallback, Dispatch } from 'react';

import {
  ActionTypes, ICategory, IQuestion, ICategoriesContext, IParentInfo, IFromUserAssignedAnswer,
  IAssignedAnswer
} from 'categories/types';

import { initialCategoriesState, CategoriesReducer } from 'categories/CategoriesReducer';
import { IDateAndBy, ICat } from 'global/types';
import { IAnswer, IGroup } from 'groups/types';

const CategoriesContext = createContext<ICategoriesContext>({} as any);
const CategoryDispatchContext = createContext<Dispatch<any>>(() => null);

type Props = {
  children: React.ReactNode
}

export const CategoryProvider: React.FC<Props> = ({ children }) => {

  const globalState = useGlobalState();
  const { dbp } = globalState;

  const [state, dispatch] = useReducer(CategoriesReducer, initialCategoriesState);
  const { parentNodes } = state;
  const { parentNodesIds } = parentNodes!;

  const reloadCategoryNode = useCallback(async (categoryId: string, questionId: string | null): Promise<any> => {
    try {
      const ids: { id: string, title: string }[] = [];
      let category = await dbp!.get("Categories", categoryId);
      if (category) {
        ids.push({ id: category.id, title: category.title });
      }
      while (category && category.parentCategory !== 'null') {
        category = await dbp!.get("Categories", category.parentCategory);
        if (category) {
          ids.push({ id: category.id, title: category.title })
        }
      }
      dispatch({
        type: ActionTypes.SET_PARENT_CATEGORIES, payload: {
          parentNodes: {
            categoryId,
            questionId,
            parentNodesIds: ids.map(c => c.id)
          }
        }
      })

      // const res = await axios.get(`/api/categories/get-parent-categories/${categoryId}`);
      // const { status, data } = res;
      // if (status === 200) {
      //   console.log('!!! get-parent-categories', { cId: categoryId.toString(), data })
      //   dispatch({
      //     type: ActionTypes.SET_PARENT_CATEGORIES, payload: {
      //       parentNodes: {
      //         categoryId,
      //         questionId,
      //         parentNodesIds: data.map((c: { _id: string, title: string }) => c._id)
      //       }
      //     }
      //   })
      // }
    }
    catch (err) {
      console.error(err);
    }
    return false;
  }, [dispatch]);



  const getSubCategories = useCallback(async ({ parentCategory, level }: IParentInfo) => {
    //const url = `/api/categories/${wsId}-${parentCategory}`
    try {
      const tx = dbp!.transaction('Categories')
      const index = tx.store.index('parentCategory_idx');
      const list: ICategory[] = [];
      for await (const cursor of index.iterate(parentCategory)) {
        const category: ICategory = cursor.value;
        console.log(category);
        //const index = tx.store.index('parentCategory_idx');
        // const arr = await index.getAllKeys(category.id);
        // category.hasSubCategories = arr.length > 0;
        list.push(category);
      }
      await tx.done;
      const subCategories = list.map((c: ICategory) => ({
        ...c,
        questions: [],
        isExpanded: parentNodesIds ? parentNodesIds.includes(c.id) : false
      }))
      dispatch({ type: ActionTypes.SET_SUB_CATEGORIES, payload: { subCategories } });
    }
    catch (error: any) {
      console.log(error)
      dispatch({ type: ActionTypes.SET_ERROR, payload: { error } });
    }
  }, [parentNodesIds]);

  const createCategory = useCallback(async (category: ICategory) => {
    dispatch({ type: ActionTypes.SET_LOADING }) // TODO treba li ovo 
    try {
      await dbp!.add('Categories', category);
      console.log('Category successfully created')
      dispatch({ type: ActionTypes.SET_ADDED_CATEGORY, payload: { category: { ...category, questions: [] } } });
      dispatch({ type: ActionTypes.CLOSE_CATEGORY_FORM })
    }
    catch (error: any) {
      console.log('error', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: { error } });
    }
  }, []);

  const setCategory = async (id: string, type: ActionTypes.SET_CATEGORY) => {
    dispatch({ type: ActionTypes.SET_LOADING });
    if (!dbp) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: { error: new Error("db is null") } });
      return;
    }
    const category = await dbp.get("Categories", id);
    dispatch({ type, payload: { category: { ...category } } });
  };

  const getCategory = async (id: string, type: ActionTypes.VIEW_CATEGORY | ActionTypes.EDIT_CATEGORY) => {
    dispatch({ type: ActionTypes.SET_LOADING });
    if (!dbp) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: { error: new Error("db is null") } });
      return;
    }
    const category: ICategory = await dbp.get("Categories", id);
    //      hasMore: true
    dispatch({
      type, payload: {
        category: {
          ...category
        }
      }
    });
  };

  const viewCategory = useCallback((id: string) => {
    getCategory(id, ActionTypes.VIEW_CATEGORY)
  }, []);

  const editCategory = useCallback((id: string) => {
    getCategory(id, ActionTypes.EDIT_CATEGORY)
  }, []);

  const updateCategory = useCallback(async (c: ICategory, closeForm: boolean) => {
    const { id, variations, title, kind, modified } = c;
    dispatch({ type: ActionTypes.SET_CATEGORY_LOADING, payload: { id, loading: false } });
    try {
      const category = await dbp!.get('Categories', id);
      const obj: ICategory = {
        ...category,
        variations,
        title,
        kind,
        modified
      }
      await dbp!.put('Categories', obj);
      console.log("Category successfully updated");
      dispatch({ type: ActionTypes.CLEAN_SUB_TREE, payload: { category: obj } });
      dispatch({ type: ActionTypes.SET_CATEGORY, payload: { category: obj } });
      if (closeForm)
        dispatch({ type: ActionTypes.CLOSE_CATEGORY_FORM })
    }
    catch (error: any) {
      console.log('error', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: { error } });
    }
  }, []);

  const deleteCategory = async (id: string) => {
    try {
      const category = await dbp!.delete('Categories', id);
      console.log("Category successfully deleted");
      dispatch({ type: ActionTypes.DELETE, payload: { id } });
    }
    catch (error: any) {
      console.log('error', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: { error } });
    }
  };

  const deleteCategoryTag = async (id: string, variationName: string) => {
    try {
      const category = await dbp!.get('Categories', id);
      const obj: ICategory = {
        ...category,
        variations: category.variations.filter((variation: string) => variation !== variationName),
        modified: {
          date: new Date(),
          by: {
            nickName: globalState.authUser.nickName
          }
        }
      }
      updateCategory(obj, false);
      console.log("Category Tag successfully deleted");
    }
    catch (error: any) {
      console.log('error', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: { error } });
    }
  };


  const expandCategory = async (category: ICategory, expanding: boolean) => {
    const { id, numOfQuestions, questions } = category;
    try {
      // if (numOfQuestions > 0 && questions.length === 0) {
      //   await loadCategoryQuestions({ parentCategory: id, startCursor: 0, level: 0 });
      // }
      dispatch({ type: ActionTypes.SET_EXPANDED, payload: { id, expanding } });
    }
    catch (error: any) {
      console.log('error', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: { error } });
    }
  };


  /////////////
  // Questions
  //

  const pageSize = 12;
  const loadCategoryQuestions = useCallback(async ({ parentCategory, startCursor, includeQuestionId }: IParentInfo)
    : Promise<any> => {
    const questions: IQuestion[] = [];
    try {
      dispatch({ type: ActionTypes.SET_CATEGORY_QUESTIONS_LOADING, payload: { questionLoading: true } }) // id: parentCategory,
      let n = 0;
      let included = false;
      let hasMore = false;
      let advanced = false;
      console.time();
      const tx = dbp!.transaction('Questions', 'readonly');
      const index = tx.store.index('parentCategory_title_idx');
      for await (const cursor of index.iterate(IDBKeyRange.bound([parentCategory, ''], [parentCategory, 'zzzzz'], false, true))) {
        if (startCursor! > 0 && !advanced) {
          cursor.advance(startCursor!);
          advanced = true;
        }
        else {
          const id = cursor.primaryKey;
          if (includeQuestionId && id === includeQuestionId) {
            included = true;
          }
          questions.push({ ...cursor.value, id, included });
          n++;
          if (n >= pageSize && (includeQuestionId ? included : true)) {
            hasMore = true;
            break;
          }
        }
      }
      await tx.done;
      console.log('>>>loadCategoryQuestions of:', parentCategory, questions)
      console.timeEnd();
      await dispatch({ type: ActionTypes.LOAD_CATEGORY_QUESTIONS, payload: { parentCategory, questions, hasMore } });
    }
    catch (error: any) {
      console.log(error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error });
      dispatch({ type: ActionTypes.SET_CATEGORY_QUESTIONS_LOADING, payload: { questionLoading: false } })
    }
    return true;

  }, []);


  const createQuestion = useCallback(async (question: IQuestion, fromModal: boolean): Promise<any> => {
    dispatch({ type: ActionTypes.SET_LOADING }) // TODO treba li ovo 
    try {
      const tx = dbp!.transaction(['Categories', 'Questions'], 'readwrite');
      const id = await tx.objectStore('Questions').add(question);
      question.id = parseInt(id.toString());
      console.log('Question successfully created')

      const category: ICategory = await tx.objectStore('Categories').get(question.parentCategory);
      category.numOfQuestions += 1;
      await tx.objectStore('Categories').put(category);
      // TODO check setting inViewing, inEditing, inAdding to false

      dispatch({ type: ActionTypes.SET_QUESTION, payload: { question } });
      return question;
    }
    catch (error: any) {
      console.log('error', error);
      if (fromModal) {
        return { message: error.message }; //'Something is wrong' };
      }
      dispatch({ type: ActionTypes.SET_ERROR, payload: { error } });
      return {};
    }
  }, []);


  const getQuestion = async (id: number, type: ActionTypes.VIEW_QUESTION | ActionTypes.EDIT_QUESTION) => {
    // const url = `/api/questions/get-question/${id}`;
    try {
      const question: IQuestion = await dbp!.get("Questions", id);
      const { parentCategory } = question;
      const category: ICategory = await dbp!.get("Categories", parentCategory)
      question.id = id;
      question.categoryTitle = category.title;

      // const { fromUserAssignedAnswer } = question;
      // if (fromUserAssignedAnswer) {
      //   question.questionAnswers.forEach(questionAnswer => {
      //     const user = fromUserAssignedAnswer!.find((fromUser: IFromUserAssignedAnswer) =>
      //       fromUser.id === questionAnswer.assigned.by.userId);
      //     questionAnswer.user.createdBy = user ? user.createdBy : 'unknown'
      //   })
      //   delete question.fromUserAssignedAnswer;
      // }
      if (category.numOfQuestions > 0) {
        //await loadCategoryQuestions({ parentCategory, startCursor: 0, level: 0 });
      }
      dispatch({ type, payload: { question } });
    }
    catch (error: any) {
      console.log(error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error });
    }

    //console.log(`FETCHING --->>> ${url}`)
    // dispatch({ type: ActionTypes.SET_LOADING })
    // axios
    //   .get(url)
    //   .then(({ data }) => {
    //     const question: IQuestion = data;
    //     const { fromUserAssignedAnswer } = question;
    //     question.questionAnswers.forEach(questionAnswer => {
    //       const user = fromUserAssignedAnswer!.find((fromUser: IFromUserAssignedAnswer) => fromUser._id === questionAnswer.assigned.by.userId);
    //       questionAnswer.user.createdBy = user ? user.createdBy : 'unknown'
    //     })
    //     delete question.fromUserAssignedAnswer;
    //     dispatch({ type, payload: { question } });
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //     dispatch({ type: ActionTypes.SET_ERROR, payload: error });
    //   });
  };

  const viewQuestion = useCallback((id: number) => {
    getQuestion(id, ActionTypes.VIEW_QUESTION);
  }, []);

  const editQuestion = useCallback((id: number) => {
    getQuestion(id, ActionTypes.EDIT_QUESTION);
  }, []);

  const updateQuestion = useCallback(async (q: IQuestion): Promise<any> => {
    const { id } = q;
    //dispatch({ type: ActionTypes.SET_CATEGORY_LOADING, payload: { id, loading: false } });
    try {
      const question = await dbp!.get('Questions', id!);
      const obj: IQuestion = {
        ...question,
        title: q.title,
        modified: q.modified,
        source: q.source,
        status: q.status
      }
      await dbp!.put('Questions', obj, id);
      console.log("Question successfully updated");
      obj.id = id;
      dispatch({ type: ActionTypes.SET_QUESTION, payload: { question: obj } });
      return obj;
    }
    catch (error: any) {
      console.log('error', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: { error } });
    }
    // try {
    //   const url = `/api/questions/update-question/${question._id}`
    //   const res = await axios.put(url, question)
    //   const { status, data } = res;
    //   if (status === 200) {
    //     // TODO check setting inViewing, inEditing, inAdding to false
    //     console.log("Question successfully updated");
    //     dispatch({ type: ActionTypes.SET_QUESTION, payload: { question: data } });
    //     return data;
    //   }
    //   else {
    //     console.log('Status is not 200', status)
    //     dispatch({
    //       type: ActionTypes.SET_ERROR,
    //       payload: {
    //         error: new Error('Status is not 200 status:' + status)
    //       }
    //     })
    //     return {};
    //   }
    // }
    // catch (err: any | Error) {
    //   if (axios.isError(err)) {
    //     dispatch({
    //       type: ActionTypes.SET_ERROR,
    //       payload: {
    //         error: new Error(axios.isError(err) ? err.response?.data : err)
    //       }
    //     })
    //     return {};
    //   }
    //   else {
    //     console.log(err);
    //   }
    //   return {}
    // }
  }, []);

  const assignQuestionAnswer = useCallback(async (questionId: number, answerId: number, assigned: IDateAndBy): Promise<any> => {
    try {
      const question: IQuestion = await dbp!.get('Questions', questionId);
      const answer: IAnswer = await dbp!.get('Answers', answerId);
      const newAssignedAnwser: IAssignedAnswer = {
        answer: {
          id: answerId
          // title: answer.title
        },
        user: {
          nickName: globalState.authUser.nickName,
          createdBy: 'date string'
        },
        assigned
      }
      const assignedAnswers = [...question.assignedAnswers, newAssignedAnwser];
      const obj: IQuestion = {
        ...question,
        assignedAnswers,
        numOfAssignedAnswers: assignedAnswers.length
      }
      await dbp!.put('Questions', obj, questionId);
      console.log("Question Answer successfully assigned", obj);
      ///////////////////
      // newAssignedAnwser.answer.title = answer.title;
      // obj.assignedAnswers = [...question.assignedAnswers, newAssignedAnwser];;
      // dispatch({ type: ActionTypes.SET_QUESTION, payload: { question: obj } });
      dispatch({ type: ActionTypes.SET_QUESTION_AFTER_ASSIGN_ANSWER, payload: { question: { id: questionId, ...obj } } });
    }
    catch (error: any) {
      console.log('error', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: { error } });
    }
  }, []);


  const unAssignQuestionAnswer = useCallback(async (questionId: number, answerId: number): Promise<any> => {
    try {
      const question = await dbp!.get('Questions', questionId);
      // const answer: IAnswer = await dbp!.get('Answers', answerId);

      const assignedAnswers = question.assignedAnswers.filter((aa: IAssignedAnswer) => aa.answer.id !== answerId);
      const obj: IQuestion = {
        ...question,
        assignedAnswers,
        numOfAssignedAnswers: assignedAnswers.length
      }
      await dbp!.put('Questions', obj, questionId);
      console.log("Question Answer successfully assigned");
      dispatch({ type: ActionTypes.SET_QUESTION_AFTER_ASSIGN_ANSWER, payload: { question: { id: questionId, ...obj } } });
      return obj;
    }
    catch (error: any) {
      console.log('error', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: { error } });
    }
    // try {
    //   const url = `/api/questions/unassign-question-answer/${questionId}`
    //   const res = await axios.put(url, { answerId });
    //   const { status, data } = res;
    //   if (status === 200) {
    //     console.log("Answer successfully un-assigned from Question");
    //     dispatch({ type: ActionTypes.SET_QUESTION_AFTER_ASSIGN_ANSWER, payload: { question: data } });
    //   }
    //   else {
    //     console.log('Status is not 200', status)
    //     dispatch({
    //       type: ActionTypes.SET_ERROR,
    //       payload: { error: new Error('Status is not 200 status:' + status) }
    //     });
    //   }
    // }
    // catch (err: any | Error) {
    //   if (axios.isError(err)) {
    //     dispatch({
    //       type: ActionTypes.SET_ERROR,
    //       payload: {
    //         error: err
    //       }
    //     })
    //   }
    //   else {
    //     console.log(err);
    //   }
    // }
  }, []);

  const createAnswer = useCallback(async (answer: IAnswer): Promise<any> => {
    // try {
    //   const res = await axios.post(`/api/answers/create-answer`, answer);
    //   const { status, data } = res;
    //   if (status === 200) {
    //     console.log('Answer successfully created')
    //     return data;
    //   }
    //   else {
    //     console.log('Status is not 200', status)
    //   }
    // }
    // catch (error) {
    //   console.log(error);
    // }
    return null;
  }, []);

  const deleteQuestion = async (id: number, parentCategory: string) => {
    dispatch({ type: ActionTypes.SET_LOADING })
    try {
      const res = await dbp!.delete('Questions', id);
      console.log("Question successfully deleted");
      dispatch({ type: ActionTypes.DELETE_QUESTION, payload: { id, parentCategory } });
    }
    catch (error: any) {
      console.log('error', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: { error } });
    }

    // dispatch({ type: ActionTypes.SET_LOADING })
    // axios
    //   .delete(`/api/questions/delete-question/${_id}`)
    //   .then(res => {
    //     if (res.status === 200) {
    //       console.log("Question successfully deleted");
    //       dispatch({ type: ActionTypes.DELETE_QUESTION, payload: { question: res.data.question } });
    //     }
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //     dispatch({ type: ActionTypes.SET_ERROR, payload: error });
    //   });
  };

  const contextValue: ICategoriesContext = {
    state, reloadCategoryNode,
    getSubCategories, createCategory, viewCategory, editCategory, updateCategory, deleteCategory, deleteCategoryTag,
    expandCategory, loadCategoryQuestions, createQuestion, viewQuestion, editQuestion, updateQuestion, deleteQuestion,
    assignQuestionAnswer, unAssignQuestionAnswer, createAnswer
  }
  return (
    <CategoriesContext.Provider value={contextValue}>
      <CategoryDispatchContext.Provider value={dispatch}>
        {children}
      </CategoryDispatchContext.Provider>
    </CategoriesContext.Provider>
  );
}

export function useCategoryContext() {
  return useContext(CategoriesContext);
}

export const useCategoryDispatch = () => {
  return useContext(CategoryDispatchContext)
};

