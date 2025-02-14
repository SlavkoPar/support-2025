
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faRemove, faCaretRight, faCaretDown, faPlus, faQuestion } from '@fortawesome/free-solid-svg-icons'
import QPlus from 'assets/QPlus.png';

import { ListGroup, Button, Badge } from "react-bootstrap";

import { useGlobalState } from 'global/GlobalProvider'
import { ActionTypes, ICategoryInfo, Mode } from "categories/types";
import { useCategoryContext, useCategoryDispatch } from 'categories/CategoryProvider'
import { useHover } from 'common/components/useHover';
import { ICategory } from 'categories/types'

import CategoryList from "categories/components/CategoryList";
import AddCategory from "categories/components/AddCategory";
import EditCategory from "categories/components/EditCategory";
import ViewCategory from "categories/components/ViewCategory";
import QuestionList from './questions/QuestionList';

const CategoryRow = ({ category }: { category: ICategory }) => {
    const { id, title, level, inViewing, inEditing, inAdding, hasSubCategories, questions, numOfQuestions, isExpanded } = category;

    const { canEdit, isDarkMode, variant, bg } = useGlobalState();

    const { state, viewCategory, editCategory, deleteCategory, expandCategory } = useCategoryContext();
    const dispatch = useCategoryDispatch();

    const alreadyAdding = state.mode === Mode.AddingCategory;
    // TODO proveri ovo
    const showQuestions = numOfQuestions > 0 || questions.find(q => q.inAdding) // && !questions.find(q => q.inAdding); // We don't have questions loaded

    const del = () => {
        deleteCategory(id);
    };

    const expand = (id: string) => {
        //const collapse = isExpanded;
        //dispatch({ type: ActionTypes.SET_EXPANDED, payload: { id, expanding: !isExpanded } });
        expandCategory(category, !isExpanded);
        // if (collapse)
        //     dispatch({ type: ActionTypes.CLEAN_SUB_TREE, payload: { id } })
    }

    const edit = (id: string) => {
        // Load data from server and reinitialize category
        editCategory(id);
    }

    const onSelectCategory = (id: string) => {
        // Load data from server and reinitialize category
        if (canEdit)
            editCategory(id);
        else
            viewCategory(id);
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
                disabled={alreadyAdding || (!hasSubCategories && numOfQuestions === 0)}
            >
                <FontAwesomeIcon icon={isExpanded ? faCaretDown : faCaretRight} size='lg' />
            </Button>
            <Button
                variant='link'
                size="sm"
                className={`py-0 mx-0 text-decoration-none ${(inViewing || inEditing) ? 'fw-bold' : ''}`}
                title={id!.toString()}
                onClick={() => onSelectCategory(id!)}
                disabled={alreadyAdding}
            >
                {title}
            </Button>

            <Badge pill bg="secondary" className={numOfQuestions === 0 ? 'd-none' : 'd-inline'}>
                {numOfQuestions}Q
                {/* <FontAwesomeIcon icon={faQuestion} size='sm' /> */}
                {/* <img width="22" height="18" src={Q} alt="Question" /> */}
            </Badge>

            {/* {canEdit && !alreadyAdding && hoverProps.isHovered &&
                <Button variant='link' size="sm" className="ms-1 py-0 px-0"
                    //onClick={() => { dispatch({ type: ActionTypes.EDIT, category }) }}>
                    onClick={() => edit(id!)}
                >
                    <FontAwesomeIcon icon={faEdit} size='lg' />
                </Button>
            } */}

            {/* TODO what about archive questions */}
            {canEdit && !alreadyAdding && hoverProps.isHovered && numOfQuestions === 0 && 
                <div className="position-absolute d-flex align-items-center top-0 end-0">
                    <Button variant='link' size="sm" className="py-0 mx-1 float-end"
                        onClick={del}
                    >
                        <FontAwesomeIcon icon={faRemove} size='lg' />
                    </Button>
                    <Button
                        variant='link'
                        size="sm"
                        className="py-0 mx-1 text-primary float-end"
                        title="Add SubCategory"
                        onClick={() => {
                            dispatch({
                                type: ActionTypes.ADD_SUB_CATEGORY,
                                payload: {
                                    parentCategory: category.id,
                                    level: category.level
                                }
                            })
                            if (!isExpanded)
                                dispatch({ type: ActionTypes.SET_EXPANDED, payload: { id, expanding: true } });
                        }}
                    >
                        <FontAwesomeIcon icon={faPlus} size='lg' />
                    </Button>
                    <Button
                        variant='link'
                        size="sm"
                        className="py-0 mx-1 text-secondary float-end"
                        title="Add Question"
                        onClick={async () => {
                            const categoryInfo: ICategoryInfo = { id: category.id, level: category.level }
                            if (!isExpanded) {
                                await dispatch({ type: ActionTypes.SET_EXPANDED, payload: { id, expanding: true } });
                            }
                            await dispatch({ type: ActionTypes.ADD_QUESTION, payload: { categoryInfo } });
                        }}
                    >
                        <img width="22" height="18" src={QPlus} alt="Add Question" />
                    </Button>
                </div>

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
                {inAdding && state.mode === Mode.AddingCategory ? (
                    <AddCategory category={category} inLine={true} />
                )
                    : ((inEditing && state.mode === Mode.EditingCategory) ||
                        (inViewing && state.mode === Mode.ViewingCategory)) ? (
                        <>
                            {/* <div class="d-lg-none">hide on lg and wider screens</div> */}
                            <div id='divInLine' className="ms-0 d-md-none w-100">
                                {inEditing && <EditCategory inLine={true} />}
                                {inViewing && <ViewCategory inLine={true} />}
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
                    className="py-0 px-0" // border border-3 border-warning"
                    variant={"primary"}
                    as="li"
                >
                    {isExpanded &&
                        <>
                            <CategoryList level={level + 1} parentCategory={id} title={title} />
                            {showQuestions &&
                                <QuestionList level={level + 1} parentCategory={id} title={title} />
                            }
                        </>
                    }

                </ListGroup.Item>
            }
        </>
    );
};

export default CategoryRow;
