
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faRemove, faCaretRight, faCaretDown, faPlus, faThumbsUp } from '@fortawesome/free-solid-svg-icons'
import APlus from 'assets/APlus.png';

import { ListGroup, Button, Badge } from "react-bootstrap";

import { useGlobalState } from 'global/GlobalProvider'
import { ActionTypes, IGroupInfo, Mode } from "groups/types";
import { useGroupContext, useGroupDispatch } from 'groups/GroupProvider'
import { useHover } from 'common/components/useHover';
import { IGroup } from 'groups/types'

import GroupList from "groups/components/GroupList";
import AddGroup from "groups/components/AddGroup";
import EditGroup from "groups/components/EditGroup";
import ViewGroup from "groups/components/ViewGroup";
import AnswerList from './answers/AnswerList';

const GroupRow = ({ group }: { group: IGroup }) => {
    const { id, title, level, inViewing, inEditing, inAdding, hasSubGroups, answers, numOfAnswers, isExpanded } = group;

    const { canEdit, isDarkMode, variant, bg } = useGlobalState();

    const { state, viewGroup, editGroup, deleteGroup, expandGroup } = useGroupContext();
    const dispatch = useGroupDispatch();

    const alreadyAdding = state.mode === Mode.AddingGroup;
    // TODO proveri ovo
    const showAnswers = numOfAnswers > 0 || answers.find(q => q.inAdding) // && !answers.find(q => q.inAdding); // We don't have answers loaded

    const del = () => {
        deleteGroup(id);
    };

    const expand = (id: string) => {
        //const collapse = isExpanded;
        //dispatch({ type: ActionTypes.SET_EXPANDED, payload: { id, expanding: !isExpanded } });
        expandGroup(group, !isExpanded);
        // if (collapse)
        //     dispatch({ type: ActionTypes.CLEAN_SUB_TREE, payload: { id } })
    }

    const edit = (id: string) => {
        // Load data from server and reinitialize group
        editGroup(id);
    }

    const onSelectGroup = (id: string) => {
        // Load data from server and reinitialize group
        if (canEdit)
            editGroup(id);
        else
            viewGroup(id);
    }

    const [hoverRef, hoverProps] = useHover();

    const Row1 =
        <div ref={hoverRef} className="d-flex justify-content-start align-items-center w-100 text-primary">
            <Button
                variant='link'
                size="sm"
                className="py-0 px-1"
                onClick={() => expand(id!)}
                title="Expand"
                disabled={alreadyAdding || (!hasSubGroups && numOfAnswers === 0)}
            >
                <FontAwesomeIcon icon={isExpanded ? faCaretDown : faCaretRight} size='lg' />
            </Button>
            <Button
                variant='link'
                size="sm"
                className={`py-0 mx-0 text-decoration-none ${(inViewing || inEditing) ? 'fw-bold' : ''}`}
                title={id!.toString()}
                onClick={() => onSelectGroup(id!)}
                disabled={alreadyAdding}
            >
                {title}
            </Button>

            <Badge pill bg="secondary" className={numOfAnswers === 0 ? 'd-none' : 'd-inline'}>
                {numOfAnswers}a
                {/* <FontAwesomeIcon icon={faThumbsUp} size='sm' /> */}
                {/* <img width="22" height="18" src={A} alt="Answer" /> */}
            </Badge>

            {/* {canEdit && !alreadyAdding && hoverProps.isHovered &&
                <Button variant='link' size="sm" className="ms-1 py-0 px-0"
                    //onClick={() => { dispatch({ type: ActionTypes.EDIT, group }) }}>
                    onClick={() => edit(id!)}
                >
                    <FontAwesomeIcon icon={faEdit} size='lg' />
                </Button>
            } */}

            {canEdit && !alreadyAdding && hoverProps.isHovered && numOfAnswers === 0 &&
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
                    title="Add SubGroup"
                    onClick={() => {
                        dispatch({
                            type: ActionTypes.ADD_SUB_GROUP,
                            payload: {
                                parentGroup: group.id,
                                level: group.level
                            }
                        })
                        if (!isExpanded)
                            dispatch({ type: ActionTypes.SET_EXPANDED, payload: { id, expanding: true } });
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
                    title="Add Answer"
                    onClick={async () => {
                        const groupInfo: IGroupInfo = { id: group.id, level: group.level }
                        if (!isExpanded) {
                            await dispatch({ type: ActionTypes.SET_EXPANDED, payload: { id, expanding: true } });
                        }
                        await dispatch({ type: ActionTypes.ADD_ANSWER, payload: { groupInfo } });
                    }}
                >
                    <img width="22" height="18" src={APlus} alt="Add Answer" />
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
                {inAdding && state.mode === Mode.AddingGroup ? (
                    <AddGroup group={group} inLine={true} />
                )
                    : ((inEditing && state.mode === Mode.EditingGroup) ||
                        (inViewing && state.mode === Mode.ViewingGroup)) ? (
                        <>
                            {/* <div class="d-lg-none">hide on lg and wider screens</div> */}
                            <div id='divInLine' className="ms-0 d-md-none w-100">
                                {inEditing && <EditGroup inLine={true} />}
                                {inViewing && <ViewGroup inLine={true} />}
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
                            <GroupList level={level + 1} parentGroup={id} title={title} />
                            {showAnswers &&
                                <AnswerList level={level + 1} parentGroup={id} title={title} />
                            }
                        </>
                    }

                </ListGroup.Item>
            }
        </>
    );
};

export default GroupRow;
