import React, { useState } from "react";
import { Button, ListGroup, Modal } from "react-bootstrap";
import { IAssignedAnswer } from "categories/types";
import { useGlobalContext } from "global/GlobalProvider";
import QuestionAnswerRow from "global/ChatBotPage/QuestionAnswerRow";
import { AutoSuggestAnswers } from 'categories/AutoSuggestAnswers'
import { IDateAndBy } from "global/types";
import { IAnswer } from "groups/types";
import AddAnswer from "categories/components/questions/AddAnswer"
import { initialAnswer } from "groups/GroupsReducer";

interface IProps {
    questionId: number,
    questionTitle: string,
    assignedAnswers: IAssignedAnswer[],
    isDisabled: boolean
}

const AssignedAnswers = ({ questionId, questionTitle, assignedAnswers, isDisabled }: IProps) => {

    //const { state, assignQuestionAnswer, unAssignQuestionAnswer } = useCategoryContext();
    const { globalState, assignQuestionAnswer } = useGlobalContext();
    const { authUser, isDarkMode, variant, dbp, error } = globalState;

    const [showAdd, setShowAdd] = useState(false);
    const handleClose = () => setShowAdd(false);

    const closeModal = () => {
        handleClose();
    }

    const [showAssign, setShowAssign] = useState(false);

    const onSelectQuestionAnswer = async (parentGroup: string, answerId: number) => {
        const assigned: IDateAndBy = {
            date: new Date(),
            by: {
                nickName: globalState.authUser.nickName
            }
        }
        // TODO in next version do not update MongoDB immediately, wait until users presses Save
        // User could have canceled question update
        await assignQuestionAnswer(questionId, answerId, assigned);
        setShowAssign(false);
    }

    const onAnswerCreated = async (answer: IAnswer | null) => {
        if (answer)
            await onSelectQuestionAnswer(answer.parentGroup, answer.id!)
        handleClose()
    }

    const unAssignAnswer = async (answerId: number) => {
        //await unAssignQuestionAnswer(questionId, answerId);
    }

    return (
        <div className={'mx-0 my-1 border rounded-2 px-3 py-1 border border-info'} >
            <div>
                <label className="text-info">Assigned Answers</label>
                <ListGroup as="ul" variant={variant} className='my-1'>
                    {assignedAnswers.map((assignedAnswer: IAssignedAnswer) =>
                        <QuestionAnswerRow
                            questionTitle={questionTitle}
                            questionAnswer={assignedAnswer}
                            groupInAdding={false}
                            isDisabled={isDisabled}
                            unAssignAnswer={unAssignAnswer}
                        />)
                        // key={assignedAnswer.answer.id.toString()}
                    }
                </ListGroup>
                {error && <div>error</div>}
                {/* {state.loading && <div>...loading</div>} */}
            </div>
            {true && // we expect no question will ever assign all the answers from the database
                <div className="d-flex justify-content-start w-100 align-items-center py-1">
                    <Button
                        size="sm"
                        className="button-edit py-0 rounded-1"
                        title="Assign a new Answer"
                        style={{ border: '1px solid silver', fontSize: '12px' }}
                        variant={variant}
                        disabled={isDisabled}
                        onClick={
                            (e) => {
                                setShowAssign(true);
                                e.preventDefault()
                            }
                        }>
                        Assign answer
                    </Button>
                    <Button
                        size="sm"
                        className="button-edit py-0 rounded-1 mx-1"
                        title="Add and Assign a new Answer"
                        style={{ border: '1px solid silver', fontSize: '12px' }}
                        variant={variant}
                        disabled={isDisabled}
                        onClick={
                            (e) => {
                                setShowAdd(true);
                                e.preventDefault()
                            }
                        }>
                        Add a new answer
                    </Button>
                </div>
            }

            <Modal
                show={showAdd}
                onHide={handleClose}
                animation={true}
                centered
                size="lg"
                className={`${isDarkMode ? "" : ""}`}
                contentClassName={`${isDarkMode ? "bg-info bg-gradient" : ""}`}
            >
                <Modal.Header closeButton>
                    <Modal.Title>{questionTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <AddAnswer
                        answer={initialAnswer}
                        inLine={true}
                        closeModal={closeModal}
                        onAnswerCreated={onAnswerCreated}
                    />
                </Modal.Body>
            </Modal>

            <Modal
                show={showAssign}
                onHide={() => setShowAssign(false)}
                animation={true}
                size="lg"
                centered
                className={`${isDarkMode ? "dark" : ""}`}
                contentClassName={`${isDarkMode ? "dark" : ""}`}>
                <Modal.Header closeButton>
                    <Modal.Title>Assign the answer</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ height: '40vh', width: '50vw' }} className="question-answers">

                    <AutoSuggestAnswers
                        dbp={dbp!}
                        tekst={''}
                        alreadyAssigned={
                            assignedAnswers.length === 0
                                ? []
                                : assignedAnswers.map((a: IAssignedAnswer) => a.answer.id)
                        }
                        onSelectQuestionAnswer={onSelectQuestionAnswer}
                    />
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AssignedAnswers;
