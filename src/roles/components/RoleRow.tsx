
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEdit, faRemove, faCaretRight, faCaretDown, faPlus, faThumbsUp } from '@fortawesome/free-solid-svg-icons'

import { ListGroup, Button, Badge } from "react-bootstrap";

import { useGlobalState } from 'global/GlobalProvider'
import { ActionTypes, IRoleInfo, Mode } from "roles/types";
import { useRoleContext, useRoleDispatch } from 'roles/RoleProvider'
import { useHover } from 'common/components/useHover';
import { IRole } from 'roles/types'

import RoleList from "roles/components/RoleList";
import AddRole from "roles/components/AddRole";
import EditRole from "roles/components/EditRole";
import ViewRole from "roles/components/ViewRole";
import UserList from './users/UserList';

const RoleRow = ({ role }: { role: IRole }) => {
    const { title, level, inViewing, inEditing, inAdding, hasSubRoles, users, numOfUsers, isExpanded } = role;

    const { canEdit, isDarkMode, variant, bg } = useGlobalState();

    const { state, viewRole, editRole, deleteRole, expandRole } = useRoleContext();
    const dispatch = useRoleDispatch();

    const alreadyAdding = state.mode === Mode.AddingRole;
    const showUsers = numOfUsers > 0 || users.find(q => q.inAdding) ; // && !users.find(q => q.inAdding); // We don't have users loaded

    const del = () => {
        deleteRole(title);
    };

    const expand = (title: string) => {
        //const collapse = isExpanded;
        //dispatch({ type: ActionTypes.SET_EXPANDED, payload: { id, expanding: !isExpanded } });
        expandRole(role, !isExpanded);
        // if (collapse)
        //     dispatch({ type: ActionTypes.CLEAN_SUB_TREE, payload: { id } })
    }

    const edit = (title: string) => {
        // Load data from server and reinitialize role
        editRole(title);
    }

    const onSelectRole = (title: string) => {
        // Load data from server and reinitialize role
        if (canEdit)
            editRole(title);
        else
            viewRole(title);
    }

    const [hoverRef, hoverProps] = useHover();

    const Row1 =
        <div ref={hoverRef} className="d-flex justify-content-start align-items-center w-100 text-primary">
            <Button
                variant='link'
                size="sm"
                className="py-0 px-1"
                onClick={() => expand(title!)}
                title="Expand"
                disabled={alreadyAdding || (!hasSubRoles && numOfUsers === 0)}
            >
                <FontAwesomeIcon icon={isExpanded ? faCaretDown : faCaretRight} size='lg' />
            </Button>
            <Button
                variant='link'
                size="sm"
                className={`py-0 mx-0 text-decoration-none ${(inViewing || inEditing) ? 'fw-bold' : ''}`}
                title={title!.toString()}
                onClick={() => onSelectRole(title!)}
                disabled={alreadyAdding}
            >
                {title}
            </Button>

            <Badge pill bg="secondary" className={numOfUsers === 0 ? 'd-none' : 'd-inline'}>
                {numOfUsers}<FontAwesomeIcon icon={faUser} size='sm' />
            </Badge>

            {/* {canEdit && !alreadyAdding && hoverProps.isHovered &&
                <Button variant='link' size="sm" className="ms-1 py-0 px-0"
                    //onClick={() => { dispatch({ type: ActionTypes.EDIT, role }) }}>
                    onClick={() => edit(id!)}
                >
                    <FontAwesomeIcon icon={faEdit} size='lg' />
                </Button>
            } */}

            {canEdit && !alreadyAdding && hoverProps.isHovered && numOfUsers === 0 &&
                <Button variant='link' size="sm" className="ms-1 py-0 mx-1"
                    onClick={del}
                >
                    <FontAwesomeIcon icon={faRemove} size='lg' />
                </Button>
            }

            {canEdit && !alreadyAdding && hoverProps.isHovered &&
                <Button
                    variant='link'
                    size="sm"
                    className="ms-2 py-0 mx-1 text-primary"
                    title="Add SubRole"
                    onClick={() => {
                        dispatch({
                            type: ActionTypes.ADD_SUB_ROLE,
                            payload: {
                                parentRole: role.title,
                                level: role.level
                            }
                        })
                        if (!isExpanded)
                            dispatch({ type: ActionTypes.SET_EXPANDED, payload: { title, expanding: true } });
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} size='lg' />
                </Button>
            }

            {canEdit && !alreadyAdding && hoverProps.isHovered &&
                <Button
                    variant='link'
                    size="sm"
                    className="ms-2 py-0 mx-1 text-secondary"
                    title="Add User"
                    onClick={async () => {
                        const roleInfo: IRoleInfo = { title: role.title, level: role.level }
                        if (!isExpanded) {
                            await dispatch({ type: ActionTypes.SET_EXPANDED, payload: { title, expanding: true } });
                        }
                        await dispatch({ type: ActionTypes.ADD_USER, payload: { roleInfo } });
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} size='lg' />
                    <FontAwesomeIcon icon={faUser} size='lg' style={{ marginLeft: '-5px' }} />
                </Button>
            }

        </div>

    // console.log({ title, isExpanded })
    return (
        <>
            <ListGroup.Item
                variant={"primary"}
                className="py-0 px-1 w-100"
                as="li"
            >
                {inAdding && state.mode === Mode.AddingRole ? (
                    <AddRole role={role} inLine={true} />
                )
                    : ((inEditing && state.mode === Mode.EditingRole) ||
                        (inViewing && state.mode === Mode.ViewingRole)) ? (
                        <>
                            {/* <div class="d-lg-none">hide on lg and wider screens</div> */}
                            <div id='divInLine' className="ms-0 d-md-none w-100">
                                {inEditing && <EditRole inLine={true} />}
                                {inViewing && <ViewRole inLine={true} />}
                            </div>
                            <div className="d-none d-md-block">
                                {Row1}
                            </div>
                        </>
                    )
                        : (
                            Row1
                        )
                }
            </ListGroup.Item>

            {/* !inAdding && */}
            {(isExpanded || inViewing || inEditing || inAdding) && // Row2
                <ListGroup.Item
                    className="py-0 px-0"
                    variant={"primary"}
                    as="li"
                >
                    {isExpanded &&
                        <>
                            <RoleList level={level + 1} parentRole={title} title={title} />
                            {showUsers &&
                                <UserList level={level + 1} parentRole={title} title={title} />
                            }
                        </>
                    }

                </ListGroup.Item>
            }
        </>
    );
};

export default RoleRow;
