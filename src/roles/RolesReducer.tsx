import { ROLES } from 'global/types';
import { Reducer } from 'react'
import { Mode, ActionTypes, IRolesState, IRole, IUser, RolesActions } from "roles/types";

export const initialUser: IUser = {
  // temp _id for inAdding, to server as list key
  // it will be removed on submitForm
  // real _id will be given by the MongoDB 
  nickName: '',
  name: '',
  password: 'pwd',
  email: 'a@b.com',
  color: 'navy',
  parentRole: ROLES.VIEWER,
  role: ROLES.VIEWER,
  roleTitle: '',
  level: 1,
  confirmed: true,
  isDarkMode: true,
  archived: false
}

export const initialRole: IRole = {
  // temp _id for inAdding, to server as list key
  // it will be removed on submitForm
  // real _id will be given by the MongoDB 
  title: '',
  level: 0,
  parentRole: 'null',
  hasSubRoles: false,
  users: [],
  numOfUsers: 0,
  hasMore: false,
  isExpanded: false,
  archived: false
}

export const initialState: IRolesState = {
  mode: Mode.NULL,
  roles: [],
  currentRoleExpanded: '',
  lastRoleExpanded: null,
  roleId_userId_done: null,
  parentNodes: {
    roleId: null,
    nickName: null,
    parentNodesIds: null
  },
  loading: false,
  userLoading: false
}

let initialStateFromLocalStorage: IRolesState | undefined;

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
  const s = localStorage.getItem('ROLES_STATE');
  if (s !== null) {
    initialStateFromLocalStorage = JSON.parse(s);
    if (hasMissingProps()) {
      initialStateFromLocalStorage = undefined;
    }
    else {
      const { currentRoleExpanded, parentNodes } = initialStateFromLocalStorage!;
      initialStateFromLocalStorage = {
        ...initialStateFromLocalStorage!,
        lastRoleExpanded: currentRoleExpanded,
        parentNodes
      }
      console.log('roles initialState FromLocalStorage', { initialStateFromLocalStorage });
    }
  }
}

export const initialRolesState: IRolesState = initialStateFromLocalStorage
  ? initialStateFromLocalStorage
  : initialState

export const RolesReducer: Reducer<IRolesState, RolesActions> = (state, action) => {
  const newState = reducer(state, action);
  console.log('reducer', action, newState.roles[2])
  const aTypesToStore = [
    ActionTypes.SET_EXPANDED
  ];
  if (aTypesToStore.includes(action.type)) {
    const value = JSON.stringify({
      ...initialState,
      currentRoleExpanded: newState.currentRoleExpanded
    })
    localStorage.setItem('ROLES_STATE', value);
  }
  return newState;
}

const reducer = (state: IRolesState, action: RolesActions) => {
  switch (action.type) {

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: true
      }

    case ActionTypes.SET_ROLE_LOADING:
      const { title, loading } = action.payload; // role doesn't contain inViewing, inEditing, inAdding 
      return {
        ...state,
        // roles: state.roles.map(c => c.id === id
        //   ? { ...c, isLoading }
        //   : c)
        loading
      }

    case ActionTypes.SET_ROLE_USERS_LOADING:
      const { userLoading } = action.payload; // role doesn't contain inViewing, inEditing, inAdding 
      return {
        ...state,
        userLoading
      }

    case ActionTypes.SET_PARENT_ROLES: {
      const { parentNodes } = action.payload;
      console.log("SET_PARENT_ROLES", parentNodes)
      return {
        ...state,
        parentNodes,
        lastRoleExpanded: null,
        roleId_userId_done: `${parentNodes.roleId}_${parentNodes.nickName}`,
      };
    }

    case ActionTypes.SET_SUB_ROLES: {
      const { subRoles } = action.payload;
      const roles = state.roles.concat(subRoles);
      return {
        ...state,
        roles,
        loading: false
      };
    }

    case ActionTypes.CLEAN_SUB_TREE: {
      const { title } = action.payload.role;
      const arr = markForClean(state.roles, title!)
      console.log('clean:', arr)
      const ids = arr.map(c => c.title)
      if (arr.length === 0)
        return {
          ...state
        }
      else
        return {
          ...state,
          roles: state.roles.filter(c => !ids.includes(c.title))
        }
    }

    case ActionTypes.CLEAN_TREE: {
      return {
        ...state,
        roles: []
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

    case ActionTypes.ADD_SUB_ROLE: {
      const { parentRole, level } = action.payload;
      const role: IRole = {
        ...initialRole,
        //title: '',
        level: level + 1,
        parentRole: parentRole ?? 'null',
        inAdding: true
      }
      return {
        ...state,
        roles: [...state.roles, role],
        mode: Mode.AddingRole
      };
    }

    case ActionTypes.SET_ADDED_ROLE: {
      const { role } = action.payload;
      // role doesn't contain inViewving, inEditing, inAdding 
      return {
        ...state,
        roles: state.roles.map(c => c.inAdding ? role : c),
        mode: Mode.NULL,
        loading: false
      }
    }

    case ActionTypes.SET_ROLE: {
      const { role } = action.payload; // role doesn't contain inViewing, inEditing, inAdding 
      const { users } = role;
      const cat = state.roles.find(c => c.title === role.title);
      const userInAdding = cat!.users.find(q => q.inAdding);
      if (userInAdding) {
        users.unshift(userInAdding);
        console.assert(state.mode === Mode.AddingUser, "expected Mode.AddingUser")
      }
      return {
        ...state,
        roles: state.roles.map(c => c.title === role.title
          ? {
            ...role,
            users,
            inViewing: c.inViewing, inEditing: c.inEditing, inAdding: c.inAdding, isExpanded: c.isExpanded
          }
          : c),
        // keep mode
        loading: false
      }
    }

    case ActionTypes.VIEW_ROLE: {
      const { role } = action.payload;
      return {
        ...state,
        roles: state.roles.map(c => c.title === role.title
          ? { ...role, users: c.users, inViewing: true, isExpanded: c.isExpanded } // role.users are inside of object
          : { ...c, inViewing: false }
        ),
        mode: Mode.ViewingRole,
        loading: false
      };
    }

    case ActionTypes.EDIT_ROLE: {
      const { role } = action.payload;
      return {
        ...state,
        roles: state.roles.map(c => c.title === role.title
          ? { ...role, users: c.users, inEditing: true, isExpanded: false } //c.isExpanded }
          : { ...c, inEditing: false }
        ),
        mode: Mode.EditingRole,
        loading: false
      };
    }

    case ActionTypes.LOAD_ROLE_USERS: {
      const { parentRole, users, hasMore } = action.payload; // role doesn't contain inViewing, inEditing, inAdding 
      const role = state.roles.find(c => c.title === parentRole);
      const userInAdding = role!.users.find(q => q.inAdding);
      if (userInAdding) {
        //users.unshift(userInAdding);
        console.assert(state.mode === Mode.AddingUser, "expected Mode.AddingUser")
      }
      console.log('num of users', role!.users.length + users.length)
      return {
        ...state,
        roles: state.roles.map(c => c.title === parentRole
          ? {
            ...c,
            users: c.users.concat(users),
            hasMore,
            inViewing: c.inViewing,
            inEditing: c.inEditing,
            inAdding: c.inAdding,
            isExpanded: c.isExpanded
          }
          : c),
        // keep mode
        userLoading: false
      }
    }

    case ActionTypes.DELETE: {
      const { title } = action.payload;
      return {
        ...state,
        mode: Mode.NULL,
        roles: state.roles.filter(c => c.title !== title)
      };
    }

    case ActionTypes.CANCEL_ROLE_FORM:
    case ActionTypes.CLOSE_ROLE_FORM: {
      const roles = state.mode === Mode.AddingRole
        ? state.roles.filter(c => !c.inAdding)
        : state.roles
      return {
        ...state,
        mode: Mode.NULL,
        roles: roles.map(c => ({ ...c, inViewing: false, inEditing: false, inAdding: false }))
      };
    }

    case ActionTypes.SET_EXPANDED: {
      const { title, expanding } = action.payload;
      let { roles } = state;
      if (!expanding) {
        const arr = markForClean(roles, title!)
        console.log('clean:', arr)
        const ids = arr.map(c => c.title)
        if (ids.length > 0) {
          roles = roles.filter(c => !ids.includes(c.title))
        }
      }
      return {
        ...state,
        roles: roles.map(c => c.title === title
          ? { ...c, inViewing: c.inViewing, inEditing: c.inEditing, isExpanded: expanding }
          : c
        ),
        mode: expanding ? Mode.NULL : state.mode,// expanding ? state.mode : Mode.NULL,  // TODO  close form only if inside of colapsed node
        currentRoleExpanded: expanding ? title : state.currentRoleExpanded
      };
    }

    // First we add a new user to the role.guestions
    // After user clicks Save, we call createUser 
    case ActionTypes.ADD_USER: {
      const { roleInfo } = action.payload;
      const { title, level } = roleInfo;
      const user: IUser = {
        ...initialUser,
        parentRole: title, //ROLES.VIEWER,
        role: title as ROLES,
        roleTitle: title,
        level,
        inAdding: true
      }
      return {
        ...state,
        roles: state.roles.map(c => c.title === title
          ? { ...c, users: [user, ...c.users], inAdding: true }  // numOfUsers: c.numOfUsers+1, 
          : { ...c, inAdding: false }),
        mode: Mode.AddingUser
      };
    }

    case ActionTypes.VIEW_USER: {
      const { user } = action.payload;
      return {
        ...state,
        roles: state.roles.map(c => c.title === user.parentRole
          ? {
            ...c,
            users: c.users.map(q => q.nickName === user.nickName ? {
              ...user,
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
        mode: Mode.ViewingUser,
        loading: false
      }
    }

    case ActionTypes.SET_USER: {
      const { user } = action.payload;
      const { parentRole, nickName } = user;
      const inAdding = state.mode === Mode.AddingUser;

      // for inAdding, id is IDBValidKey('000000000000000000000000')
      // thats why we look for q.inAdding instead of q.id === id
      const roles = state.roles.map(c => c.title === parentRole
        ? {
          ...c,
          users: inAdding
            ? c.users.map(q => q.inAdding ? { ...user, inAdding: false } : q)
            : c.users.map(q => q.nickName === nickName ? { ...user, inEditing: false, inViewing: false } : q),
          inViewing: false,
          inEditing: false,
          inAdding: false
        }
        : c
      );
      return {
        ...state,
        roles,
        mode: Mode.NULL,
        loading: false
      };
    }

    case ActionTypes.SET_USER_AFTER_ASSIGN_USER: {
      const { user } = action.payload;
      const { parentRole, nickName } = user;
      const inAdding = state.mode === Mode.AddingUser;

      // for inAdding, _id is IDBValidKey('000000000000000000000000')
      // thats why we look for q.inAdding instead of q._id === _id
      const roles = state.roles.map(c => c.title === parentRole
        ? {
          ...c,
          users: inAdding
            ? c.users.map(u => u.inAdding ? { ...user, inAdding: u.inAdding } : u)
            : c.users.map(u => u.nickName === nickName ? { ...user, inEditing: u.inEditing } : u),
          inEditing: c.inEditing,
          inAdding: c.inAdding
        }
        : c
      );
      console.log({ roles })
      return {
        ...state,
        roles,
        mode: state.mode, // keep mode
        loading: false
      };
    }

    case ActionTypes.EDIT_USER: {
      const { user } = action.payload;
      return {
        ...state,
        roles: state.roles.map(c => c.title === user.parentRole
          ? {
            ...c,
            users: c.users.map(q => q.nickName === user.nickName ? {
              ...user,
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
        mode: Mode.EditingUser,
        loading: false
      };
    }

    case ActionTypes.DELETE_USER: {
      const { nickName, parentRole } = action.payload;
      return {
        ...state,
        roles: state.roles.map(c => c.title === parentRole
          ? {
            ...c,
            users: c.users.filter(q => q.nickName !== nickName)
          }
          : c
        ),
        mode: Mode.NULL
      }
    }

    case ActionTypes.CANCEL_USER_FORM:
    case ActionTypes.CLOSE_USER_FORM: {
      const { user } = action.payload;
      const role = state.roles.find(c => c.title === user.parentRole)
      let users: IUser[] = [];
      switch (state.mode) {
        case Mode.AddingUser: {
          console.assert(role!.inAdding, "expected role.inAdding");
          users = role!.users.filter(q => !q.inAdding)
          break;
        }

        case Mode.ViewingUser: {
          console.assert(role!.inViewing, "expected role.inViewing");
          users = role!.users.map(q => ({ ...q, inViewing: false }))
          break;
        }

        case Mode.EditingUser: {
          console.assert(role!.inEditing, "expected role.inEditing");
          users = role!.users.map(q => ({ ...q, inEditing: false }))
          break;
        }

        default:
          break;
      }

      return {
        ...state,
        roles: state.roles.map(c => c.title === user.parentRole
          ? { ...c, users, inAdding: false, inEditing: false, inViewing: false }
          : c
        ),
        mode: Mode.NULL,
      };
    }

    default:
      return state;  // TODO throw error
  }
};

function markForClean(roles: IRole[], parentRole: IDBValidKey) {
  let deca = roles
    .filter(c => c.parentRole === parentRole)
    .map(c => ({ title: c.title, parentRole: c.parentRole }))

  deca.forEach(c => {
    deca = deca.concat(markForClean(roles, c.title!))
  })
  return deca
}
