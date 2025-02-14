import { Reducer } from 'react'
import { Mode, ActionTypes, IGroupsState, IGroup, IAnswer, GroupsActions } from "groups/types";

export const initialAnswer: IAnswer = {
  // temp _id for inAdding, to server as list key
  // it will be removed on submitForm
  // real _id will be given by the MongoDB 
  id: 0, // real id will be given by DB
  parentGroup: '',
  groupTitle: '',
  title: '',
  level: 0,
  source: 0,
  status: 0,
  archived: false
}

export const initialGroup: IGroup = {
  // temp _id for inAdding, to server as list key
  // it will be removed on submitForm
  // real _id will be given by the MongoDB 
  id: '',
  title: '',
  level: 0,
  parentGroup: 'null',
  hasSubGroups: false,
  answers: [],
  numOfAnswers: 0,
  hasMore: false,
  isExpanded: false,
  archived: false
}

export const initialState: IGroupsState = {
  mode: Mode.NULL,
  groups: [],
  currentGroupExpanded: '',
  lastGroupExpanded: null,
  groupId_answerId_done: null,
  parentNodes: {
    groupId: null,
    answerId: null,
    parentNodesIds: null
  },
  loading: false,
  answerLoading: false
}

let initialStateFromLocalStorage: IGroupsState | undefined;

const hasMissingProps = (): boolean => {
  let b = false;
  const keys = Object.keys(initialStateFromLocalStorage!)
  Object.keys(initialState).forEach((prop: string) => {
    if (!keys.includes(prop)) {
      b = true;
      console.log('missing prop:', prop, ' try with SignOut')
    }
  })
  return b;
}

if ('localStorage' in window) {
  const s = localStorage.getItem('GROUPS_STATE');
  if (s !== null) {
    initialStateFromLocalStorage = JSON.parse(s);
    if (hasMissingProps()) {
      initialStateFromLocalStorage = undefined;
    }
    else {
      const { currentGroupExpanded, parentNodes } = initialStateFromLocalStorage!;
      initialStateFromLocalStorage = {
        ...initialStateFromLocalStorage!,
        lastGroupExpanded: currentGroupExpanded,
        parentNodes
      }
      console.log('groups initialState FromLocalStorage', { initialStateFromLocalStorage });
    }
  }
}

export const initialGroupsState: IGroupsState = initialStateFromLocalStorage
  ? initialStateFromLocalStorage
  : initialState

export const GroupsReducer: Reducer<IGroupsState, GroupsActions> = (state, action) => {
  const newState = reducer(state, action);
  console.log('reducer', action, newState.groups[2])
  const aTypesToStore = [
    ActionTypes.SET_EXPANDED
  ];
  if (aTypesToStore.includes(action.type)) {
    const value = JSON.stringify({
      ...initialState,
      currentGroupExpanded: newState.currentGroupExpanded
    })
    localStorage.setItem('GROUPS_STATE', value);
  }
  return newState;
}

const reducer = (state: IGroupsState, action: GroupsActions) => {
  switch (action.type) {

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: true
      }

    case ActionTypes.SET_GROUP_LOADING:
      const { id, loading } = action.payload; // group doesn't contain inViewing, inEditing, inAdding 
      return {
        ...state,
        // groups: state.groups.map(c => c.id === id
        //   ? { ...c, isLoading }
        //   : c)
        loading
      }

    case ActionTypes.SET_GROUP_ANSWERS_LOADING:
      const { answerLoading } = action.payload; // group doesn't contain inViewing, inEditing, inAdding 
      return {
        ...state,
        answerLoading
      }

    case ActionTypes.SET_PARENT_GROUPS: {
      const { parentNodes } = action.payload;
      console.log("SET_PARENT_GROUPS", parentNodes)
      return {
        ...state,
        parentNodes,
        lastGroupExpanded: null,
        groupId_answerId_done: `${parentNodes.groupId}_${parentNodes.answerId}`,
      };
    }

    case ActionTypes.SET_SUB_GROUPS: {
      const { subGroups } = action.payload;
      const groups = state.groups.concat(subGroups);
      return {
        ...state,
        groups,
        loading: false
      };
    }

    case ActionTypes.CLEAN_SUB_TREE: {
      const { id } = action.payload.group;
      const arr = markForClean(state.groups, id!)
      console.log('clean:', arr)
      const ids = arr.map(c => c.id)
      if (arr.length === 0)
        return {
          ...state
        }
      else
        return {
          ...state,
          groups: state.groups.filter(c => !ids.includes(c.id))
        }
    }

    case ActionTypes.CLEAN_TREE: {
      return {
        ...state,
        groups: []
      }
    }

    case ActionTypes.SET_ERROR: {
      const { error } = action.payload;
      return {
        ...state,
        error,
        loading: false
      };
    }

    case ActionTypes.ADD_SUB_GROUP: {
      const { parentGroup, level } = action.payload;
      const group: IGroup = {
        ...initialGroup,
        title: '',
        level: level + 1,
        parentGroup: parentGroup??'null',
        inAdding: true
      }
      return {
        ...state,
        groups: [...state.groups, group],
        mode: Mode.AddingGroup
      };
    }

    case ActionTypes.SET_ADDED_GROUP: {
      const { group } = action.payload;
      // group doesn't contain inViewving, inEditing, inAdding 
      return {
        ...state,
        groups: state.groups.map(c => c.inAdding ? group : c),
        mode: Mode.NULL,
        loading: false
      }
    }

    case ActionTypes.SET_GROUP: {
      const { group } = action.payload; // group doesn't contain inViewing, inEditing, inAdding 
      const { answers } = group;
      const cat = state.groups.find(c => c.id === group.id);
      const answerInAdding = cat!.answers.find(q => q.inAdding);
      if (answerInAdding) {
        answers.unshift(answerInAdding);
        console.assert(state.mode === Mode.AddingAnswer, "expected Mode.AddingAnswer")
      }
      return {
        ...state,
        groups: state.groups.map(c => c.id === group.id
          ? {
            ...group,
            answers,
            inViewing: c.inViewing, inEditing: c.inEditing, inAdding: c.inAdding, isExpanded: c.isExpanded
          }
          : c),
        // keep mode
        loading: false
      }
    }

    case ActionTypes.VIEW_GROUP: {
      const { group } = action.payload;
      return {
        ...state,
        groups: state.groups.map(c => c.id === group.id
          ? { ...group, answers: c.answers, inViewing: true, isExpanded: c.isExpanded } // group.answers are inside of object
          : { ...c, inViewing: false }
        ),
        mode: Mode.ViewingGroup,
        loading: false
      };
    }

    case ActionTypes.EDIT_GROUP: {
      const { group } = action.payload;
      return {
        ...state,
        groups: state.groups.map(c => c.id === group.id
          ? { ...group, answers: c.answers, inEditing: true, isExpanded: false } //c.isExpanded }
          : { ...c, inEditing: false }
        ),
        mode: Mode.EditingGroup,
        loading: false
      };
    }

    case ActionTypes.LOAD_GROUP_ANSWERS: {
      const { parentGroup, answers, hasMore } = action.payload; // group doesn't contain inViewing, inEditing, inAdding 
      const group = state.groups.find(c => c.id === parentGroup);
      if (answers.length > 0 && group!.answers.map(q => q.id).includes(answers[0].id)) {
        // privremeno  TODO  uradi isto i u group/answers
        // We have, at two places:
        //   <EditCategory inLine={true} />
        //   <EditCategory inLine={false} />
        //   so we execute loadCategoryQuestions() twice in QuestionList, but OK
        //return state;
      }

      const answerInAdding = group!.answers.find(q => q.inAdding);
      if (answerInAdding) {
        //answers.unshift(answerInAdding);
        console.assert(state.mode === Mode.AddingAnswer, "expected Mode.AddingAnswer")
      }
      return {
        ...state,
        groups: state.groups.map(c => c.id === parentGroup
          ? {
            ...c,
            answers: c.answers.concat(answers),
            hasMore,
            inViewing: c.inViewing,
            inEditing: c.inEditing,
            inAdding: c.inAdding,
            isExpanded: c.isExpanded
          }
          : c),
        // keep mode
        answerLoading: false
      }
    }

    case ActionTypes.DELETE: {
      const { id } = action.payload;
      return {
        ...state,
        mode: Mode.NULL,
        groups: state.groups.filter(c => c.id !== id)
      };
    }

    case ActionTypes.CANCEL_GROUP_FORM:
    case ActionTypes.CLOSE_GROUP_FORM: {
      const groups = state.mode === Mode.AddingGroup
        ? state.groups.filter(c => !c.inAdding)
        : state.groups
      return {
        ...state,
        mode: Mode.NULL,
        groups: groups.map(c => ({ ...c, inViewing: false, inEditing: false, inAdding: false }))
      };
    }

    case ActionTypes.SET_EXPANDED: {
      const { id, expanding } = action.payload;
      let { groups } = state;
      if (!expanding) {
        const arr = markForClean(groups, id!)
        console.log('clean:', arr)
        const ids = arr.map(c => c.id)
        if (ids.length > 0) {
          groups = groups.filter(c => !ids.includes(c.id))
        }
      }
      return {
        ...state,
        groups: groups.map(c => c.id === id
          ? { ...c, inViewing: c.inViewing, inEditing: c.inEditing, isExpanded: expanding }
          : c
        ),
        mode: expanding ? Mode.NULL : state.mode,// expanding ? state.mode : Mode.NULL,  // TODO  close form only if inside of colapsed node
        currentGroupExpanded: expanding ? id : state.currentGroupExpanded
      };
    }

    // First we add a new answer to the group.guestions
    // After user clicks Save, we call createAnswer 
    case ActionTypes.ADD_ANSWER: {
      const { groupInfo } = action.payload;
      const { id, level } = groupInfo;
      const answer: IAnswer = {
        ...initialAnswer,
        parentGroup: id,
        level,
        inAdding: true
      }
      return {
        ...state,
        groups: state.groups.map(c => c.id === id
          ? { ...c, answers: [answer, ...c.answers], inAdding: true } // numOfAnswers: c.numOfAnswers+1,
          : { ...c, inAdding: false }),
        mode: Mode.AddingAnswer
      };
    }

    case ActionTypes.VIEW_ANSWER: {
      const { answer } = action.payload;
      return {
        ...state,
        groups: state.groups.map(c => c.id === answer.parentGroup
          ? {
            ...c,
            answers: c.answers.map(q => q.id === answer.id ? {
              ...answer,
              inViewing: true
            }
              : {
                ...q,
                inViewing: false
              }),
            inViewing: true
          }
          : {
            ...c,
            inViewing: false
          }
        ),
        mode: Mode.ViewingAnswer,
        loading: false
      }
    }

    case ActionTypes.SET_ANSWER: {
      const { answer } = action.payload;
      const { parentGroup, id } = answer;
      const inAdding = state.mode === Mode.AddingAnswer;

      // for inAdding, id is IDBValidKey('000000000000000000000000')
      // thats why we look for q.inAdding instead of q.id === id
      const groups = state.groups.map(c => c.id === parentGroup
        ? {
          ...c,
          answers: inAdding
            ? c.answers.map(q => q.inAdding ? { ...answer, inAdding: false } : q)
            : c.answers.map(q => q.id === id ? {...answer, inEditing: false, inViewing: false } : q),
          inViewing: false,
          inEditing: false,
          inAdding: false
        }
        : c
      );
      return {
        ...state,
        groups,
        mode: Mode.NULL,
        loading: false
      };
    }

    case ActionTypes.SET_ANSWER_AFTER_ASSIGN_ANSWER: {
      const { answer } = action.payload;
      const { parentGroup, id } = answer;
      const inAdding = state.mode === Mode.AddingAnswer;

      // for inAdding, _id is IDBValidKey('000000000000000000000000')
      // thats why we look for q.inAdding instead of q._id === _id
      const groups = state.groups.map(c => c.id === parentGroup
        ? {
          ...c,
          answers: inAdding
            ? c.answers.map(q => q.inAdding ? { ...answer, inAdding: q.inAdding } : q)
            : c.answers.map(q => q.id === id ? { ...answer, inEditing: q.inEditing } : q),
          inEditing: c.inEditing,
          inAdding: c.inAdding
        }
        : c
      );
      console.log({ groups })
      return {
        ...state,
        groups,
        mode: state.mode, // keep mode
        loading: false
      };
    }

    case ActionTypes.EDIT_ANSWER: {
      const { answer } = action.payload;
      return {
        ...state,
        groups: state.groups.map(c => c.id === answer.parentGroup
          ? {
            ...c,
            answers: c.answers.map(q => q.id === answer.id ? {
              ...answer,
              inEditing: true
            }
              : {
                ...q,
                inEditing: false
              }),
            inEditing: true
          }
          : {
            ...c,
            inEditing: false
          }
        ),
        mode: Mode.EditingAnswer,
        loading: false
      };
    }

    case ActionTypes.DELETE_ANSWER: {
      const { id, parentGroup } = action.payload;
      return {
        ...state,
        groups: state.groups.map(c => c.id === parentGroup
          ? {
            ...c,
            answers: c.answers.filter(q => q.id !== id)
          }
          : c
        ),
        mode: Mode.NULL
      }
    }

    case ActionTypes.CANCEL_ANSWER_FORM:
    case ActionTypes.CLOSE_ANSWER_FORM: {
      const { answer } = action.payload;
      const group = state.groups.find(c => c.id === answer.parentGroup)
      let answers: IAnswer[] = [];
      switch (state.mode) {
        case Mode.AddingAnswer: {
          console.assert(group!.inAdding, "expected group.inAdding");
          answers = group!.answers.filter(q => !q.inAdding)
          break;
        }

        case Mode.ViewingAnswer: {
          console.assert(group!.inViewing, "expected group.inViewing");
          answers = group!.answers.map(q => ({ ...q, inViewing: false }))
          break;
        }

        case Mode.EditingAnswer: {
          console.assert(group!.inEditing, "expected group.inEditing");
          answers = group!.answers.map(q => ({ ...q, inEditing: false }))
          break;
        }

        default:
          break;
      }

      return {
        ...state,
        groups: state.groups.map(c => c.id === answer.parentGroup
          ? { ...c, answers, numOfAnswers: answers.length, inAdding: false, inEditing: false, inViewing: false }
          : c
        ),
        mode: Mode.NULL,
      };
    }

    default:
      return state;  // TODO throw error
  }
};

function markForClean(groups: IGroup[], parentGroup: IDBValidKey) {
  let deca = groups
    .filter(c => c.parentGroup === parentGroup)
    .map(c => ({ id: c.id, parentGroup: c.parentGroup }))

  deca.forEach(c => {
    deca = deca.concat(markForClean(groups, c.id!))
  })
  return deca
}
