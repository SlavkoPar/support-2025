import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faRemove, faThumbsUp, faPlus, faReply } from '@fortawesome/free-solid-svg-icons'

import { ListGroup, Button, Badge } from "react-bootstrap";

import { useGlobalState } from 'global/GlobalProvider'
import { ActionTypes, ICategoryInfo, Mode } from "categories/types";
import { useCategoryContext, useCategoryDispatch } from 'categories/CategoryProvider'
import { useHover } from 'common/components/useHover';
import { ITag } from 'categories/types'

// import AddTag from "categorys/components/tags/AddTag";
// import EditTag from "categorys/components/tags/EditTag";
// import ViewTag from "categorys/components/tags/ViewTag";

//const TagRow = ({ tag, categoryInAdding }: { ref: React.ForwardedRef<HTMLLIElement>, tag: ITag, categoryInAdding: boolean | undefined }) => {
const TagRow = ({ categoryId, tag, categoryInAdding }: { categoryId: string, tag: ITag, categoryInAdding: boolean | undefined }) => {
    const { name } = tag;
    const { id, parentCategory, level, inViewing, inEditing, inAdding, numOfTags } = {
        id: 0, 
        parentCategory:'', 
        level:0,
        inViewing: false,
        inEditing: false,
        inAdding: false, 
        numOfTags: 4
    };

    const { canEdit, isDarkMode, variant, bg } = useGlobalState();

    // const { state, viewTag, editTag, deleteTag } = useCategoryContext();
    const { state, deleteCategoryTag } = useCategoryContext();
    const dispatch = useCategoryDispatch();

    const alreadyAdding = false //state.mode === Mode.AddingTag;

    const del = () => {
        deleteCategoryTag(categoryId, name);
    };

    const edit = (id: number) => {
        // Load data from server and reinitialize tag
        //editTag(id);
    }

    const onSelectTag = (id: number) => {
        // Load data from server and reinitialize tag
        //if (canEdit)
            //editTag(id);
        //else
            //viewTag(id);
    }

    const [hoverRef, hoverProps] = useHover();

    const Row1 =
        // <div ref={hoverRef} className="d-flex justify-content-start align-items-center text-secondary">
        <div ref={hoverRef}>

            <Badge pill bg="secondary" className='d-inline'>
                {/* className={`text-info ${numOfTags === 0 ? 'd-none' : 'd-inline'}`} */}
                {name}
            </Badge> 

            {/* <Button
                variant='link'
                size="sm"
                className={`py-0 mx-0 text-decoration-none text-secondary ${(inViewing || inEditing) ? 'fw-bold' : ''}`}
                title={`id:${id!.toString()}`}
                onClick={() => onSelectTag(id!)}
                disabled={alreadyAdding}
            >
                {name}
            </Button> */}

            {/* {canEdit && !alreadyAdding && hoverProps.isHovered &&
                <Button variant='link' size="sm" className="ms-1 py-0 px-1 text-secondary"
                    //onClick={() => { dispatch({ type: ActionTypes.EDIT, tag }) }}>
                    onClick={() => edit(_id!)}
                >
                    <FontAwesomeIcon icon={faEdit} size='lg' />
                </Button>
            } */}

            {canEdit && !alreadyAdding && hoverProps.isHovered &&
                <Button variant='link' size="sm" className="ms-0 py-0 mx-0 text-secondary"
                    onClick={del}
                >
                    <FontAwesomeIcon icon={faRemove} size='sm' />
                </Button>
            }

            {false && canEdit && !alreadyAdding && hoverProps.isHovered &&
                <Button
                    variant='link'
                    size="sm"
                    className="ms-2 py-0 mx-1 text-secondary"
                    title="Add Tag"
                    onClick={() => {
                        console.log('click q')
                        const categoryInfo: ICategoryInfo = { id: parentCategory, level }
                        //dispatch({ type: ActionTypes.ADD_ANSWER, payload: { categoryInfo } })
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} size='lg' />
                    <FontAwesomeIcon icon={faThumbsUp} size='lg' style={{ marginLeft: '-5px' }} />
                </Button>
            }
        </div>

    return (
        <ListGroup.Item
             variant={"secondary"}
             className="py-0 px-1 w-100"
             as="li"
        >
        <div className="py-0 px-1 w-100 list-category-item">
            {inAdding && categoryInAdding && state.mode === Mode.AddingTag 
            ? (
                // <AddTag tag={tag} inLine={true} showCloseButton={true} />
                <span>add tag</span>
            )
                : ((inEditing && state.mode === Mode.EditingTag) ||
                    (inViewing && state.mode === Mode.ViewingTag)) ? (
                    <>
                        {/* <div class="d-lg-none">hide on lg and wider screens</div> */}
                        <div id='div-tag' className="ms-0 d-md-none w-100">
                            {/* {inEditing && <EditTag inLine={true} />}
                            {inViewing && <ViewTag inLine={true} />} */}
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
            </div>
        </ListGroup.Item>
    );
};

export default TagRow;
