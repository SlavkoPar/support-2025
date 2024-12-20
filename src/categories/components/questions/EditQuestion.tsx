import React from 'react';

import { useCategoryContext, useCategoryDispatch } from 'categories/CategoryProvider'
import { useGlobalState } from 'global/GlobalProvider'

import QuestionForm from "categories/components/questions/QuestionForm";
import { ActionTypes, FormMode, IQuestion } from "categories/types";

const EditQuestion = ({ inLine }: { inLine: boolean }) => {
    const globalState = useGlobalState();

    const dispatch = useCategoryDispatch();
    const { state, updateQuestion, reloadCategoryNode } = useCategoryContext();
    const category = state.categories.find(c => c.inEditing);
    const question = category!.questions.find(q => q.inEditing)

    const submitForm = async (questionObject: IQuestion) => {
        const object: IQuestion = {
            ...questionObject,
            modified: {
                date: new Date(),
                by: {
                    userId: globalState.authUser.userId
                }
            }
        }
        const q = await updateQuestion(object)
        if (question!.groupId !== q.groupId) {
            dispatch({ type: ActionTypes.CLEAN_TREE, payload: { _id: q.groupId } })
            await reloadCategoryNode(q.groupId, q._id);
        }
    };
  

    return (
        <QuestionForm
            question={question!}
            showCloseButton={true}
            mode={FormMode.editing}
            submitForm={submitForm}
        >
            Update Question
        </QuestionForm>
    );
};

export default EditQuestion;
