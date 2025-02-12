import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { IParentInfo, IVariation } from "categories/types";
import { useCategoryContext } from "categories/CategoryProvider";
import { useGlobalState } from "global/GlobalProvider";
import { List, ListItem, Loading } from "common/components/InfiniteList";
import VariationRow from "categories/VariationRow";
import { ListGroup, Stack } from "react-bootstrap";

const VariationList = ({ categoryId, variations }: { categoryId: string, variations: IVariation[] }) => {

  const { canEdit } = useGlobalState();

  const { state } = useCategoryContext();
  const { categories, error } = state;

  //const group = categories.find(c => c.id === parentCategory)!
  // const { tags, numOfTags, hasMore } = group;

  useEffect(() => {
  }, [])


  // useEffect(() => {
  //   if (groupId != null) {
  //     if (groupId === parentCategory!.toString() && tagId) {
  //       setTimeout(() => {
  //         if (canEdit)
  //           editTag(parseInt(tagId))
  //         else
  //           viewTag(parseInt(tagId))
  //       }, 3000)
  //     }
  //   }
  // }, [viewTag, parentCategory, groupId, tagId, canEdit]);

  // console.log('TagList render', tags, level)

  return (
    <div
      className="ms-2"
    // className="max-h-[500px] max-w-[500px] overflow-auto bg-slate-100"
    // style={{ overflowX: 'auto' }}
    >
      <Stack direction="horizontal" gap={2}>
        {variations.length === 0 &&
          <div>No variations</div>
        }
        {
          variations.map((tag: IVariation) => {
            return <VariationRow
              categoryId={categoryId}
              tag={tag}
              categoryInAdding={undefined}
            />
          })}
      </Stack>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
};

export default VariationList;
