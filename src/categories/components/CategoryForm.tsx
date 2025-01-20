import React, { useEffect, useRef } from "react";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Form, CloseButton, Row } from "react-bootstrap";
import { CreatedModifiedForm } from "common/CreateModifiedForm"
import { FormButtons } from "common/FormButtons"
import { FormMode, ActionTypes, ICategoryFormProps, ICategory, ITag } from "categories/types";

import { useCategoryDispatch } from "categories/CategoryProvider";
import QuestionList from "categories/components/questions/QuestionList";
import { useGlobalContext } from "global/GlobalProvider";
import TagList from "categories/TagList";

const CategoryForm = ({ inLine, mode, category, submitForm, children }: ICategoryFormProps) => {

  const { globalState } = useGlobalContext();
  const { isDarkMode, variant, bg } = globalState;

  const viewing = mode === FormMode.viewing;
  const editing = mode === FormMode.editing;
  const adding = mode === FormMode.adding;

  const { id, title, tags, questions } = category;

  if (!document.getElementById('div-details')) {

  }
  const showQuestions = !questions.find(q => q.inAdding);
  /* 
  We have, at two places:
    <EditCategory inLine={true} />
    <EditCategory inLine={false} />
    so we execute loadCategoryQuestions() twice in QuestionList, but OK
  */


  const dispatch = useCategoryDispatch();

  const closeForm = () => {
    dispatch({ type: ActionTypes.CLOSE_CATEGORY_FORM })
  }

  const cancelForm = () => {
    dispatch({ type: ActionTypes.CANCEL_CATEGORY_FORM })
  }

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: category,
    validationSchema: Yup.object().shape({
      title: Yup.string().required("Required"),
      // email: Yup.string()
      //   .email("You have enter an invalid email address")
      //   .required("Required"),
      // rollno: Yup.number()
      //   .positive("Invalid roll number")
      //   .integer("Invalid roll number")
      //   .required("Required"),
    }),
    onSubmit: (values: ICategory) => {
      //alert(JSON.stringify(values, null, 2));
      console.log('CategoryForm.onSubmit', JSON.stringify(values, null, 2))
      submitForm(values)
      //props.handleClose(false);
    }
  });

  // eslint-disable-next-line no-self-compare
  // const nameRef = useRef<HTMLAreaElement | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current!.focus()
  }, [nameRef])


  return (
    <div className="form-wrapper p-2" data-bs-theme={`${isDarkMode ? 'dark' : 'light'}`}>
      <CloseButton onClick={closeForm} className="float-end" />
      <Row className='text-center'>
        <Form.Label>Category</Form.Label>
      </Row>
      <Form onSubmit={formik.handleSubmit}>

        <Form.Group controlId="title">
          <Form.Label>Title</Form.Label>
          <TagList categoryId={id} tags={tags.map(tag => ({ name: tag} as ITag))} />
        </Form.Group>

        <Form.Group controlId="title">
          <Form.Label>Title</Form.Label>
          <Form.Control
            as="input"
            placeholder="New Category"
            name="title"
            ref={nameRef}
            onChange={formik.handleChange}
            //onBlur={formik.handleBlur}
            // onBlur={(e: React.FocusEvent<HTMLTextAreaElement>): void => {
            //   if (isEdit && formik.initialValues.title !== formik.values.title)
            //     formik.submitForm();
            // }}
            value={formik.values.title}
            style={{ width: '100%' }}
            disabled={viewing}
          />
          <Form.Text className="text-danger">
            {formik.touched.title && formik.errors.title ? (
              <div className="text-danger">{formik.errors.title}</div>
            ) : null}
          </Form.Text>
        </Form.Group>

        {/* <Form.Group>
          <Form.Label>Number of Questions </Form.Label>
          <div className="text-secondary">{formik.values.numOfQuestions}</div>
          // <div className="p-1 bg-dark text-white">{createdBy}, {formatDate(created.date)}</div> 
        </Form.Group> */}

        <Form.Group>
          <Form.Label className="m-1 mb-0">Questions ({`${formik.values.numOfQuestions}`}) </Form.Label>
          {showQuestions &&
            <QuestionList level={1} parentCategory={id} title={title} />
          }
        </Form.Group>

        {(viewing || editing) &&
          <CreatedModifiedForm
            created={category.created}
            createdBy={category.createdBy}
            modified={category.modified}
            modifiedBy={category.modifiedBy}
            classes="text-secondary"
          />
        }

        {(editing || adding) &&
          <FormButtons
            cancelForm={cancelForm}
            handleSubmit={formik.handleSubmit}
            title={children}
          />
        }
      </Form>
    </div >
  );
};

export default CategoryForm;