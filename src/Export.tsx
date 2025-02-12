import * as React from "react";
import { useGlobalContext } from 'global/GlobalProvider'
import { ICategory } from "categories/types";
import { useEffect, useRef } from "react";
var FileSaver = require('file-saver');

interface IExport {
}



const Export: React.FC<IExport> = (props: IExport) => {

  //const aRef = useRef<HTMLAnchorElement>(null);

  const { exportToJSON } = useGlobalContext();

  const category: ICategory = {
    id: "null",
    kind: 0,
    parentCategory: "",
    title: "",
    level: 0,
    variations: [],
    questions: [],
    numOfQuestions: 0,
    hasSubCategories: true,
    categories: []
  };

  let fName = ''

  useEffect(() => {

    (async () => {
      await exportToJSON(category, 'null');
      console.log(JSON.stringify(category));

      const s = (new Date).toJSON();
      const part = s.split('.')[0]
      fName = `support-knowledge-${part}.json`
      var blob = new Blob([JSON.stringify(category, null, '\t')], { type: "application/json;charset=utf-8" });
      FileSaver.saveAs(blob, fName);
    })()
  }, [exportToJSON])


  return (
    <div>
      Exported file {fName}!
      {/* <a href="" ref={aRef}>click here to download your file</a> */}
    </div>
  )
}

export default Export;
