import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faEnvelope, faRemove } from '@fortawesome/free-solid-svg-icons'

import { ListGroup, Button, Modal } from "react-bootstrap";

import { useGlobalState } from 'global/GlobalProvider'
import { useHover } from 'common/components/useHover';
import { IAssignedAnswer } from "categories/types";
import { useCategoryContext } from "categories/CategoryProvider";
import { formatDate } from 'common/utilities'
import React, { useState } from "react";

interface IProps {
    questionTitle: string,
    assignedAnswer: IAssignedAnswer,
    groupInAdding: boolean | undefined,
    isDisabled: boolean,
    unAssignAnswer: (answerId: number) => void
}
const AssignedAnswer = ({ questionTitle, assignedAnswer: questionAnswer, isDisabled, unAssignAnswer }: IProps) => {

    const { answer, assigned, user } = questionAnswer;
    const { title, id } = answer;
    const emailFromClient = localStorage.getItem('emailFromClient');

    const rowTitle = `Created by: ${user.createdBy}, ${formatDate(new Date(assigned.date))}`

    const { authUser, canEdit, isDarkMode, variant, bg } = useGlobalState();

    const { nickName, email } = authUser;


    const { state } = useCategoryContext();

    const alreadyAdding = false;

    const del = () => {
        unAssignAnswer(answer.id)
    };

    const edit = (id: number) => {
        // Load data from server and reinitialize answer
        //editAnswer(id);
    }

    const onSelectAnswer = (id: number) => {
        // Load data from server and reinitialize answer
        //viewAnswer(id);
    }

    const sendEMail = () => {

        /*
        const values = {
            wsName,
            from_name: userName,
            to_name: emailFromClient,
            questionTitle,
            answer: title,
            email_from: email,
            email_to: emailFromClient,
            contact_number: 0
        }
        values.contact_number = Math.random() * 100000 | 0;
        */

        // emailjs.send('service_akla4ca', 'template_2nbaqbj', values, 'YeDIRPwve3mgTemkA')
        //     .then(function () {
        //         console.log('SUCCESS!');
        //         handleClose();
        //     }, function (error) {
        //         console.log('FAILED...', error);
        //         //closeForm();
        //     });
    }

    const [showReply, setShowReply] = useState(false);
    const handleClose = () => setShowReply(false);

    const copyToClipboard = (answerTitle: string): void => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(answerTitle) // input!.value)
                .then(() => {
                    console.log('Copied to clipboard successfully.');
                    alert('Answer copied to clipboard');
                }, (err) => {
                    console.log('Failed to copy the text to clipboard.', err);
                });
        }
    }

    const [hoverRef, hoverProps] = useHover();

    const Row1 =
        <div ref={hoverRef} className="d-flex justify-content-start align-items-center w-100 text-info">
            <Button
                variant='link'
                size="sm"
                className="py-0 px-1 text-info"
                onClick={() => emailFromClient ? setShowReply(true) : copyToClipboard(title!)}
            >
                <FontAwesomeIcon
                    icon={emailFromClient ? faEnvelope : faCopy}
                    size='sm'
                    title='Send this Answer in a reply on Question'
                />
            </Button>
            <Button
                variant='link'
                size="sm"
                className="py-0 mx-1 text-decoration-none text-info text-wrap"
                title={rowTitle}
                onClick={() => onSelectAnswer(answer.id)}
                disabled={alreadyAdding}
            >
                {title}
            </Button>

            {canEdit && !alreadyAdding && hoverProps.isHovered && !isDisabled &&
                <Button variant='link' size="sm" className="ms-1 py-0 mx-1 text-info"
                    onClick={del}
                >
                    <FontAwesomeIcon icon={faRemove} size='lg' />
                </Button>
            }
        </div>

    return (
        <ListGroup.Item
            key={id}
            variant={"info"}
            className="py-1 px-1"
            as="li"
        >
            {/* <div class="d-lg-none">hide on lg and wider screens</div> */}
            {Row1}

            <Modal
                show={showReply}
                onHide={handleClose}
                animation={true}
                centered
                size="lg"
                className={`${isDarkMode ? "bg" : ""}`}
                contentClassName={`${isDarkMode ? "bg-info bg-gradient" : ""}`}
            >
                <Modal.Header closeButton>
                    Send Answer in a reply on Question
                </Modal.Header>
                <Modal.Body className="py-0">
                    <table className="table-info table-hover table-bordered w-100 h-100">
                        <tbody>
                            <tr className="border-top-0"><td>To:</td><td>{emailFromClient}</td></tr>
                            <tr><td>Subject:</td><td>{questionTitle}</td></tr>
                            <tr className="border-bottom-0"><td>Body:</td><td>{title}</td></tr>
                        </tbody>
                    </table>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={handleClose}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={sendEMail}>Send E-Mail</Button>
                </Modal.Footer>
            </Modal>

        </ListGroup.Item>

    );
};

export default AssignedAnswer;
